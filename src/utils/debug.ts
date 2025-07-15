import { APP_CONFIG } from '../config.js';

export function debugLog(...args: any[]) {
  if (APP_CONFIG.DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}
