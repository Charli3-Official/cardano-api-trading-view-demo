export interface TokenData {
  ticker: string;
  policy_id: string;
  asset_name: string;
  dex: string;
  pair: string;
  base_currency?: string;
  current_price?: number;
  daily_price_change?: number;
  current_tvl?: number;
  daily_tvl_change?: number;
  daily_volume?: number;
}

export interface SearchResult {
  dex: string;
  ticker: string;
  pair: string;
  policy_id: string;
  asset_name: string;
  base_currency: string;
  currency: string;
  tvl?: number;
}

export interface AppState {
  selectedDex: string;
  currentSelectedToken: TokenData | null;
  isAutoSyncEnabled: boolean;
  selectedTimezone: string;
}

export interface CacheConfig {
  SYMBOLS_EXPIRY: number;
  TOKEN_DATA_EXPIRY: number;
  PRICE_DATA_EXPIRY: number;
  LOGO_EXPIRY: number;
  HISTORICAL_DATA_EXPIRY: number;
}

export interface HistoricalData {
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
}

export interface CandlestickDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeDataPoint {
  time: number;
  value: number;
  color: string;
}
