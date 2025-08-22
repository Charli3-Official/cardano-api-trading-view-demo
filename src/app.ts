import {
  getGroups,
  fetchHistoricalData,
  logApiCallSummary,
  resetApiCallCounter,
} from './api/index.js';
import { CacheManager } from './cache/manager.js';
import { TokenService } from './services/token.js';
import { ChartManager } from './chart/manager.js';
import { SearchComponent } from './components/search.js';
import { Utils } from './utils/helpers.js';
import { MetadataComponent } from './components/metadata.js';
import { ThemeComponent } from './components/theme.js';
import { ControlsComponent } from './components/controls.js';
import { AutoSyncService } from './services/autosync.js';
import { streamManager } from './stream.js';
import { APP_CONFIG, CACHE_CONFIG } from './config.js';
import { debugLog } from './utils/debug.js';
import type { AppState, TokenData } from './types/index.js';

export class TradingViewDemoApp {
  private cacheManager: CacheManager;
  private tokenService: TokenService;
  private chartManager: ChartManager;
  private searchComponent: SearchComponent;
  private metadataComponent: MetadataComponent;
  private themeComponent: ThemeComponent;
  private controlsComponent: ControlsComponent;
  private autoSyncService: AutoSyncService;

  private state: AppState = {
    selectedDex: APP_CONFIG.DEFAULT_DEX,
    currentSelectedToken: null,
    isAutoSyncEnabled: false, // Keep auto-sync disabled by default to save API calls
    selectedTimezone: APP_CONFIG.DEFAULT_TIMEZONE,
  };

  private allSymbolsData: Map<string, any> = new Map();

  constructor() {
    this.cacheManager = new CacheManager();
    this.tokenService = new TokenService(this.cacheManager);
    this.chartManager = new ChartManager();
    this.searchComponent = new SearchComponent(
      this.tokenService,
      this.onTokenSelect.bind(this)
    );
    this.metadataComponent = new MetadataComponent();
    this.themeComponent = new ThemeComponent(this.chartManager);
    this.controlsComponent = new ControlsComponent(
      this.updateChart.bind(this),
      this.onTimezoneChange.bind(this)
    );
    this.autoSyncService = new AutoSyncService(this.updateChart.bind(this));
  }

  async initialize() {
    try {
      console.log('🚀 App initialization started');
      resetApiCallCounter();

      await this.cacheManager.clearExpired();

      // Always initialize core components regardless of API config
      this.themeComponent.initialize();
      this.chartManager.initialize();
      this.controlsComponent.initialize();

      // Check if API configuration is available
      if (!APP_CONFIG.isConfigured()) {
        console.warn(
          'API configuration is missing. Limited functionality available.'
        );
        // Initialize search in limited mode and show configuration panel
        this.searchComponent.initialize();
        this.autoSyncService.initialize();
        // The HTML script will show the configuration panel
        debugLog(
          '✅ Application initialized in limited mode (no API configuration)'
        );
        logApiCallSummary();
        return;
      }

      // Full initialization with API access
      this.searchComponent.initialize();
      this.autoSyncService.initialize();

      console.log('📡 Starting API calls for groups and symbols...');
      const groups = await getGroups();
      console.log(`📡 Found ${groups.length} groups:`, groups);

      // Load symbols data for all groups
      for (const group of groups) {
        console.log(`📡 Loading symbols for group: ${group}`);
        const symbolsData = await this.tokenService.getSymbols(group);
        this.allSymbolsData.set(group, symbolsData);
        debugLog(
          `📊 Loaded ${symbolsData?.symbol?.length || 0} symbols for ${group}`
        );
      }

      this.setupDexSelection(groups);

      // 🔧 KEY FIX: Initialize search component with default DEX data
      const defaultDexData = this.allSymbolsData.get(APP_CONFIG.DEFAULT_DEX);
      if (defaultDexData) {
        this.searchComponent.setDex(APP_CONFIG.DEFAULT_DEX, defaultDexData);
        debugLog(`🔍 Search initialized with ${APP_CONFIG.DEFAULT_DEX} data`);
      }

      this.setupEventListeners();

      console.log('✅ Application initialization completed');
      logApiCallSummary();
      debugLog('✅ Application initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      logApiCallSummary();
    }
  }
  private onTimezoneChange(timezone: string) {
    this.state.selectedTimezone = timezone;
    this.autoSyncService.setTimezone(timezone);
    this.chartManager.setTimezone(timezone);

    if (this.state.currentSelectedToken) {
      void this.updateChart();
    }
  }
  private async onTokenSelect(tokenData: TokenData) {
    this.state.currentSelectedToken = tokenData;

    const currentTokenData = await this.tokenService.getCurrentTokenData(
      tokenData.policy_id,
      tokenData.asset_name
    );

    // Initially update without historical data
    await this.metadataComponent.update(tokenData, currentTokenData);

    if (!this.state.isAutoSyncEnabled) {
      this.controlsComponent.setDefaultDateRange();
    }

    this.controlsComponent.updateResolutionOptions();
    await this.updateChart();

    if (tokenData.dex === 'Aggregate') {
      void this.setupStreamForToken(tokenData.ticker);
    } else {
      streamManager.hideStreamWidget();
    }
  }

  private async setupStreamForToken(ticker: string) {
    try {
      const poolId = await this.getPoolIdForToken(ticker);
      if (poolId) {
        streamManager.showStreamWidget();
        await streamManager.startStream(poolId);
      } else {
        streamManager.hideStreamWidget();
      }
    } catch (error) {
      console.error('Error setting up stream:', error);
      streamManager.hideStreamWidget();
    }
  }

  private async getPoolIdForToken(ticker: string): Promise<string | null> {
    const symbolsData = this.allSymbolsData.get('Aggregate');
    if (!symbolsData?.ticker) return null;

    const tickerIndex = symbolsData.ticker.findIndex(
      (t: string) => t === ticker
    );
    return tickerIndex !== -1 ? ticker : null;
  }

  private async updateChart() {
    if (!this.state.currentSelectedToken) return;

    const { from, to, resolution } = this.controlsComponent.getTimeRange();

    // Use the exact time range selected by user - no automatic adjustments
    const adjustedFrom = from;
    const adjustedTo = to;
    const barCount = Utils.calculateBars(from, to, resolution);

    try {
      // Generate cache key for historical data
      const cacheKey = this.generateHistoricalDataCacheKey(
        this.state.currentSelectedToken.ticker,
        resolution,
        adjustedFrom,
        adjustedTo
      );

      // Try to get data from cache first
      let historicalData = await this.cacheManager.get('historical', cacheKey);

      if (
        !historicalData ||
        (await this.cacheManager.isExpired('historical', cacheKey))
      ) {
        debugLog(
          `📊 Fetching fresh historical data for ${this.state.currentSelectedToken.ticker}`
        );

        historicalData = await fetchHistoricalData(
          this.state.currentSelectedToken.ticker,
          resolution,
          adjustedFrom,
          adjustedTo
        );

        // Cache the data for future use
        await this.cacheManager.setWithExpiry(
          'historical',
          cacheKey,
          historicalData,
          CACHE_CONFIG.HISTORICAL_DATA_EXPIRY
        );

        debugLog(
          `📊 Historical data cached for ${CACHE_CONFIG.HISTORICAL_DATA_EXPIRY / 1000}s`
        );
      } else {
        debugLog(
          `📊 Using cached historical data for ${this.state.currentSelectedToken.ticker}`
        );
      }

      await this.chartManager.updateChart(historicalData, resolution);

      // Update metadata component with historical data
      if (this.state.currentSelectedToken) {
        const currentTokenData = await this.tokenService.getCurrentTokenData(
          this.state.currentSelectedToken.policy_id,
          this.state.currentSelectedToken.asset_name
        );
        await this.metadataComponent.update(
          this.state.currentSelectedToken, 
          currentTokenData, 
          historicalData
        );
      }

      // Update the bars count display
      this.updateBarsCountDisplay(barCount);
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }

  private generateHistoricalDataCacheKey(
    ticker: string,
    resolution: string,
    from: number,
    to: number
  ): string {
    // Round timestamps to avoid cache misses for minor time differences
    const roundedFrom = Math.floor(from / 60) * 60; // Round to nearest minute
    const roundedTo = Math.floor(to / 60) * 60;
    return `${ticker}_${resolution}_${roundedFrom}_${roundedTo}`;
  }

  private calculateOptimalTimeRange(
    from: number,
    to: number,
    resolution: string
  ) {
    const resolutionConfig =
      APP_CONFIG.RESOLUTION_CONFIG[
        resolution as keyof typeof APP_CONFIG.RESOLUTION_CONFIG
      ];

    if (!resolutionConfig) {
      return { adjustedFrom: from, adjustedTo: to, barCount: 0 };
    }

    const { interval, maxBars } = resolutionConfig;
    const requestedBarCount = Math.ceil((to - from) / interval);

    // If we're within limits, return original range
    if (requestedBarCount <= maxBars) {
      return {
        adjustedFrom: from,
        adjustedTo: to,
        barCount: requestedBarCount,
      };
    }

    // Calculate the maximum time range we can request
    const maxTimeRange = maxBars * interval;

    // Prefer recent data - adjust 'from' to respect the limit
    const adjustedFrom = to - maxTimeRange;

    debugLog(`📊 Data limiting: ${requestedBarCount} bars -> ${maxBars} bars`);
    debugLog(
      `📊 Time range adjusted: ${new Date(from * 1000)} -> ${new Date(adjustedFrom * 1000)}`
    );

    return {
      adjustedFrom,
      adjustedTo: to,
      barCount: maxBars,
    };
  }

  private showDataLimitNotification(
    actualBars: number,
    requestedSeconds: number,
    adjustedSeconds: number
  ) {
    const notification = document.getElementById('data-limit-notice');
    if (notification) {
      const requestedDays = Math.round(requestedSeconds / 86400);
      const adjustedDays = Math.round(adjustedSeconds / 86400);

      notification.innerHTML = `
      <span class="notification-icon">ℹ️</span>
      Showing most recent ${actualBars} bars (${adjustedDays}d) of ${requestedDays}d requested.
      <span class="notification-tip">Zoom in or use shorter time range for more detail.</span>
    `;
      notification.className = 'data-limit-notification show';

      // Auto-hide after 5 seconds
      setTimeout(() => {
        notification.classList.remove('show');
      }, 5000);
    }
  }

  private updateBarsCountDisplay(barCount: number) {
    const barsCountEl = document.getElementById('bars-count');
    if (barsCountEl) {
      barsCountEl.textContent = `${barCount} bars`;
      barsCountEl.className =
        barCount >= APP_CONFIG.MAX_BARS ? 'bars-at-limit' : '';
    }
  }

  private setupDexSelection(groups: string[]) {
    const dexListEl = document.getElementById('dex-list')!;

    groups.forEach((dex: string) => {
      const button = document.createElement('button');
      button.className =
        dex === APP_CONFIG.DEFAULT_DEX ? 'dex-button active' : 'dex-button';
      button.dataset.dex = dex;
      button.textContent = dex;
      dexListEl.appendChild(button);
    });

    dexListEl.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('dex-button')) {
        this.selectDex(target.dataset.dex || APP_CONFIG.DEFAULT_DEX);
      }
    });
  }

  private selectDex(dex: string) {
    this.state.selectedDex = dex;

    // 🔧 KEY FIX: Update search component with new DEX data
    const dexData = this.allSymbolsData.get(dex);
    this.searchComponent.setDex(dex, dexData);

    document
      .querySelectorAll('.dex-button')
      .forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-dex="${dex}"]`)?.classList.add('active');

    this.clearTokenSelection();
  }

  private clearTokenSelection() {
    this.state.currentSelectedToken = null;
    streamManager.stopStream();
    streamManager.hideStreamWidget();

    const panelEl = document.getElementById('token-info-panel');
    if (panelEl) {
      panelEl.classList.add('hidden');
    }
  }

  private setupEventListeners() {
    const retryBtn = document.getElementById('stream-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        if (
          this.state.currentSelectedToken &&
          this.state.currentSelectedToken.dex === 'Aggregate'
        ) {
          streamManager.reconnect();
        }
      });
    }
  }

  public getAPI() {
    return {
      selectToken: this.onTokenSelect.bind(this),
      getCurrentToken: () => this.state.currentSelectedToken,
      selectDex: this.selectDex.bind(this),
      updateChart: this.updateChart.bind(this),
      getState: () => ({ ...this.state }),
      resetApiConfig: () => {
        APP_CONFIG.resetCache();
        streamManager.resetAddonErrorState();
      },
      // Debug utilities
      logApiCalls: logApiCallSummary,
      resetApiCounter: resetApiCallCounter,
    };
  }

  destroy() {
    this.autoSyncService.destroy();
    this.chartManager.destroy();
  }
}
