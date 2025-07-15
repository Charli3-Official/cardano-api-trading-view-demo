import type { CacheConfig } from './types';
import { Formatters } from './utils/formatters';

// Dynamic API configuration management
class ApiConfig {
  private _apiUrl: string | null = null;
  private _bearerToken: string | null = null;

  get API_URL(): string {
    if (this._apiUrl) return this._apiUrl;

    // Check localStorage first
    const localUrl = localStorage.getItem('charli3_api_base_url');
    if (localUrl) {
      this._apiUrl = localUrl;
      return localUrl;
    }

    // Fall back to environment variable
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      this._apiUrl = envUrl;
      return envUrl;
    }

    // Default fallback
    this._apiUrl = 'https://api.charli3.io';
    return this._apiUrl;
  }

  get BEARER_TOKEN(): string {
    if (this._bearerToken) return this._bearerToken;

    // Check localStorage first
    const localToken = localStorage.getItem('charli3_api_bearer_token');
    if (localToken) {
      this._bearerToken = localToken;
      return localToken;
    }

    // Fall back to environment variable
    const envToken = import.meta.env.VITE_BEARER_TOKEN;
    if (envToken) {
      this._bearerToken = envToken;
      return envToken;
    }

    // Return empty string if no token is available
    return '';
  }

  // Reset cached values (useful when configuration changes)
  resetCache(): void {
    this._apiUrl = null;
    this._bearerToken = null;
  }

  // Check if configuration is available
  isConfigured(): boolean {
    return !!this.API_URL && !!this.BEARER_TOKEN;
  }

  // Get configuration source info for debugging
  getConfigInfo(): {
    apiUrlSource: 'localStorage' | 'env' | 'default';
    bearerTokenSource: 'localStorage' | 'env' | 'none';
    isConfigured: boolean;
  } {
    const hasLocalUrl = !!localStorage.getItem('charli3_api_base_url');
    const hasEnvUrl = !!import.meta.env.VITE_API_URL;
    const hasLocalToken = !!localStorage.getItem('charli3_api_bearer_token');
    const hasEnvToken = !!import.meta.env.VITE_BEARER_TOKEN;

    let apiUrlSource: 'localStorage' | 'env' | 'default';
    if (hasLocalUrl) apiUrlSource = 'localStorage';
    else if (hasEnvUrl) apiUrlSource = 'env';
    else apiUrlSource = 'default';

    let bearerTokenSource: 'localStorage' | 'env' | 'none';
    if (hasLocalToken) bearerTokenSource = 'localStorage';
    else if (hasEnvToken) bearerTokenSource = 'env';
    else bearerTokenSource = 'none';

    return {
      apiUrlSource,
      bearerTokenSource,
      isConfigured: this.isConfigured(),
    };
  }
}

// Create singleton instance
const apiConfig = new ApiConfig();

export const APP_CONFIG = {
  get API_URL() {
    return apiConfig.API_URL;
  },
  get BEARER_TOKEN() {
    return apiConfig.BEARER_TOKEN;
  },
  isConfigured: () => apiConfig.isConfigured(),
  resetCache: () => apiConfig.resetCache(),
  getConfigInfo: () => apiConfig.getConfigInfo(),
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  DEFAULT_DEX: 'Aggregate',
  DEFAULT_TIMEZONE: Formatters.getUserTimezone(),
  MAX_SEARCH_RESULTS: 50,
  MAX_CONCURRENT_REQUESTS: 5,
  DEFAULT_CHART_HEIGHT: 500,
  MAX_BARS: 240,

  // 🎯 ENHANCED: Resolution configuration with optimal time ranges
  RESOLUTION_CONFIG: {
    '1min': {
      interval: 60,
      maxBars: 240,
      updateInterval: 15000,
      optimalTimeRange: 4 * 3600, // 4 hours
      maxTimeRange: 240 * 60, // 4 hours max
    },
    '5min': {
      interval: 300,
      maxBars: 240,
      updateInterval: 30000,
      optimalTimeRange: 20 * 3600, // 20 hours
      maxTimeRange: 240 * 300, // 20 hours max
    },
    '15min': {
      interval: 900,
      maxBars: 240,
      updateInterval: 60000,
      optimalTimeRange: 60 * 3600, // 2.5 days
      maxTimeRange: 240 * 900, // 2.5 days max
    },
    '60min': {
      interval: 3600,
      maxBars: 240,
      updateInterval: 300000,
      optimalTimeRange: 10 * 24 * 3600, // 10 days
      maxTimeRange: 240 * 3600, // 10 days max
    },
    '1d': {
      interval: 86400,
      maxBars: 240,
      updateInterval: 1800000,
      optimalTimeRange: 8 * 30 * 24 * 3600, // 8 months
      maxTimeRange: 240 * 86400, // 8 months max
    },
  },
};

export const CACHE_CONFIG: CacheConfig = {
  SYMBOLS_EXPIRY: 30 * 60 * 1000, // 30 minutes
  TOKEN_DATA_EXPIRY: 10 * 60 * 1000, // 10 minutes (increased from 60 seconds)
  PRICE_DATA_EXPIRY: 5 * 60 * 1000, // 5 minutes
  LOGO_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  HISTORICAL_DATA_EXPIRY: 5 * 60 * 1000, // 5 minutes for historical data
};

// Remove the old RESOLUTION_CONFIG if it exists separately
export const TIMEZONES = [
  'America/Chicago',
  'UTC',
  'America/New_York',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
];
