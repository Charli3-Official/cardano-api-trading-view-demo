import { openDB } from 'idb';
import { CACHE_CONFIG } from '../config.js';
import { debugLog } from '../utils/debug.js';

export class CacheManager {
  private dbPromise: ReturnType<typeof openDB>;
  private memoryCache: Map<string, any> = new Map();

  constructor() {
    this.dbPromise = openDB('charli3-data', 4, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('symbols')) {
          db.createObjectStore('symbols');
        }
        if (!db.objectStoreNames.contains('tokenCache')) {
          db.createObjectStore('tokenCache');
        }
        if (!db.objectStoreNames.contains('cacheMetadata')) {
          db.createObjectStore('cacheMetadata');
        }
        if (!db.objectStoreNames.contains('historical')) {
          db.createObjectStore('historical');
        }
      },
    });
  }

  async get(store: string, key: string) {
    const db = await this.dbPromise;
    return await db.get(store, key);
  }

  async set(store: string, key: string, value: any) {
    const db = await this.dbPromise;
    await db.put(store, value, key);
  }

  async setWithExpiry(store: string, key: string, value: any, expiry: number) {
    const db = await this.dbPromise;
    await db.put(store, value, key);
    await db.put(
      'cacheMetadata',
      {
        timestamp: Date.now(),
        expiry: Date.now() + expiry,
        key,
        store,
      },
      `${store}_${key}`
    );
  }

  async isExpired(store: string, key: string): Promise<boolean> {
    const db = await this.dbPromise;
    const metadata = await db.get('cacheMetadata', `${store}_${key}`);

    if (!metadata) return true;
    return Date.now() > metadata.expiry;
  }

  async clearExpired(): Promise<number> {
    const db = await this.dbPromise;
    const metadataKeys = await db.getAllKeys('cacheMetadata');
    let clearedCount = 0;

    for (const key of metadataKeys) {
      if (typeof key === 'string') {
        const metadata = await db.get('cacheMetadata', key);
        if (metadata && Date.now() > metadata.expiry) {
          await db.delete(metadata.store, metadata.key);
          await db.delete('cacheMetadata', key);
          clearedCount++;
        }
      }
    }

    debugLog(`🧹 Cleared ${clearedCount} expired cache entries`);
    return clearedCount;
  }

  async clearAll() {
    const db = await this.dbPromise;
    await db.clear('symbols');
    await db.clear('tokenCache');
    await db.clear('historical');
    await db.clear('cacheMetadata');
    this.memoryCache.clear();
    debugLog('🧹 All caches cleared');
  }

  setMemory(
    key: string,
    value: any,
    expiry: number = CACHE_CONFIG.TOKEN_DATA_EXPIRY
  ) {
    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + expiry,
    });
  }

  getMemory(key: string) {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearMemoryExpired() {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (now > cached.expiry) {
        this.memoryCache.delete(key);
      }
    }
  }
}
