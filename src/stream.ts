// StreamData

import { APP_CONFIG } from './config.js';
import { ApiErrorHandler } from './utils/error-handler.js';

const DEBUG = APP_CONFIG.DEBUG;
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args);
  }
}

// Interfaces
export interface StreamData {
  block_time: number;
  pool_id: string;
  current_price: number;
  previous_price: number;
  current_tvl: number;
  previous_tvl: number;
  volume: number;
}

export interface HealthCheck {
  s: string; // 'ok'
}

// TokenStreamManager class
export class TokenStreamManager {
  private controller: AbortController | null = null;
  private isConnected = false;
  private currentPoolId: string | null = null;
  private lastDataTime = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private isAddonErrorDetected = false; // Track if addon error was detected
  private addonErrorAttempts = 0; // Track addon error attempts

  constructor() {
    // Check connection health every 30 seconds
    this.connectionCheckInterval = setInterval(
      () => this.checkConnectionHealth(),
      30000
    );
  }

  async startStream(poolId: string) {
    if (!(this.isConnected && this.currentPoolId === poolId)) {
      this.stopStream();
      this.currentPoolId = poolId;

      // Don't attempt connection if addon error was detected
      if (this.isAddonErrorDetected) {
        debugLog('🚫 Skipping stream connection due to addon error');
        this.updateStreamStatus('addon-error');
        return;
      }

      this.updateStreamStatus('connecting');

      try {
        this.controller = new AbortController();

        debugLog('🔍 Starting stream connection...');
        debugLog('Pool ID:', poolId);

        // Check if API is configured
        if (!APP_CONFIG.isConfigured()) {
          throw new Error(
            'API configuration is missing. Please configure your API key and base URL.'
          );
        }

        // Use the dynamic configuration for the full URL
        const streamUrl = `${APP_CONFIG.API_URL}/api/v1/tokens/stream`;

        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${APP_CONFIG.BEARER_TOKEN}`,
          },
          body: JSON.stringify([poolId]),
          signal: this.controller.signal,
        });

        debugLog('📡 Response received:', response.status);

        if (!response.ok) {
          const text = await response.text();
          console.error(
            `Stream request failed with status ${response.status}: ${text}`
          );

          // Analyze the error to provide better user feedback
          const errorDetails = ApiErrorHandler.analyzeError(
            response.status,
            text,
            streamUrl
          );

          if (errorDetails.isAddonError) {
            this.addonErrorAttempts++;

            // After 2 attempts, mark as permanently failed to prevent endless retries
            if (this.addonErrorAttempts >= 2) {
              this.isAddonErrorDetected = true;
              this.updateStreamStatus('addon-error');
              debugLog(
                'Addon error detected after 2 attempts, disabling further retries'
              );
              return;
            }

            this.updateStreamStatus('addon-error');
            throw new Error(errorDetails.message);
          } else if (errorDetails.errorType === 'auth') {
            ApiErrorHandler.displayErrorMessage(
              'Invalid API key. Please check your configuration.',
              'error'
            );
          } else {
            ApiErrorHandler.displayErrorMessage(errorDetails.message, 'error');
          }

          throw new Error(errorDetails.message);
        }

        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.lastDataTime = Date.now();
        this.updateStreamStatus('connected');

        await this.processStream(response);
      } catch (error) {
        console.error('Stream error:', error);
        this.isConnected = false;
        this.updateStreamStatus('error');

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(
            1000 * Math.pow(2, this.reconnectAttempts),
            30000
          );
          this.reconnectAttempts++;

          debugLog(
            `⏰ Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
          );

          setTimeout(() => {
            if (this.currentPoolId === poolId) {
              debugLog(
                `🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
              );
              void this.startStream(poolId);
            }
          }, delay);
        } else {
          console.error('🚫 Max reconnection attempts reached');
          this.updateStreamStatus('error');
        }
      }
    }
  }

  private async processStream(response: Response) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) throw new Error('No stream reader available');

    debugLog('📡 Stream connected and listening...');

    try {
      while (this.isConnected) {
        const { done, value } = await reader.read();

        if (done) {
          debugLog('📡 Stream ended');
          break;
        }

        if (value && value.length > 0) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          // Process lines sequentially to avoid issues with await in loop
          const promises = lines
            .filter(line => line.trim())
            .map(async line => {
              try {
                const data = JSON.parse(line);
                // Log ALL data for debugging
                debugLog('📦 Raw stream data:', data);
                this.handleStreamData(data);
              } catch (e) {
                console.error('Parse error:', e);
              }
            });

          // Wait for all line processing to complete
          await Promise.allSettled(promises);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Stream processing error:', error);
        this.isConnected = false;
        this.updateStreamStatus('error');
      }
      throw error;
    } finally {
      reader.releaseLock();
    }
  }

  private handleStreamData(data: StreamData | HealthCheck) {
    this.lastDataTime = Date.now();

    debugLog('🔄 handleStreamData called with:', data);

    // Health check ping
    if ('s' in data && data.s === 'ok') {
      debugLog('❤️ Health check received, connection is healthy');
      this.updateStreamStatus('connected');

      // Update timestamp to show we're receiving data
      const timestampEl = document.getElementById('stream-timestamp');
      if (timestampEl) {
        timestampEl.textContent = `Last ping: ${new Date().toLocaleTimeString()}`;
      }

      // Update data type indicator
      const dataTypeEl = document.getElementById('stream-data-type');
      if (dataTypeEl) {
        dataTypeEl.textContent = 'Health Check';
      }
      return;
    }

    // Trading event - show ALL data
    const streamData = data as StreamData;
    debugLog('💰 Trading event received for pool:', streamData.pool_id);
    debugLog('💰 Current pool:', this.currentPoolId);
    debugLog('💰 Full trading data:', streamData);

    if (streamData.pool_id === this.currentPoolId) {
      debugLog('✅ Pool ID matches, updating widget with ALL data');
      this.updateStreamWidget(streamData);
    } else {
      debugLog('❌ Pool ID mismatch, ignoring event');
    }
  }

  private updateStreamWidget(data: StreamData) {
    const widget = document.getElementById('stream-widget');
    if (!widget) return;

    debugLog('🎨 Updating widget with complete data:', data);

    // Update Pool ID
    const poolIdShort = document.getElementById('stream-pool-id-short');
    const poolIdFull = document.getElementById('stream-pool-id-full');
    if (poolIdShort && poolIdFull && data.pool_id) {
      const truncated = `${data.pool_id.substring(0, 8)}...${data.pool_id.substring(data.pool_id.length - 8)}`;
      poolIdShort.textContent = truncated;
      poolIdFull.textContent = data.pool_id;
    }

    // Update Current Price
    const currentPriceEl = document.getElementById('stream-current-price');
    if (currentPriceEl && data.current_price !== undefined) {
      currentPriceEl.textContent = this.formatPrice(data.current_price);

      // Flash animation based on price change
      const priceChange = data.previous_price
        ? ((data.current_price - data.previous_price) / data.previous_price) *
          100
        : 0;

      currentPriceEl.style.animation = 'none';
      setTimeout(() => {
        currentPriceEl.style.animation =
          priceChange >= 0 ? 'flash-green 0.5s' : 'flash-red 0.5s';
      }, 10);
    }

    // Update Previous Price
    const previousPriceEl = document.getElementById('stream-previous-price');
    if (previousPriceEl && data.previous_price !== undefined) {
      previousPriceEl.textContent = this.formatPrice(data.previous_price);
    }

    // Update Price Change
    const priceChangeEl = document.getElementById('stream-price-change');
    if (
      priceChangeEl &&
      data.current_price !== undefined &&
      data.previous_price !== undefined
    ) {
      const priceChange =
        ((data.current_price - data.previous_price) / data.previous_price) *
        100;
      priceChangeEl.textContent = this.formatPercentage(priceChange / 100);
      priceChangeEl.className = `stream-change price-change ${priceChange >= 0 ? 'positive' : 'negative'}`;
    }

    // Update Current TVL
    const currentTvlEl = document.getElementById('stream-current-tvl');
    if (currentTvlEl && data.current_tvl !== undefined) {
      currentTvlEl.textContent = this.formatNumber(data.current_tvl);
    }

    // Update Previous TVL
    const previousTvlEl = document.getElementById('stream-previous-tvl');
    if (previousTvlEl && data.previous_tvl !== undefined) {
      previousTvlEl.textContent = this.formatNumber(data.previous_tvl);
    }

    // Update TVL Change
    const tvlChangeEl = document.getElementById('stream-tvl-change');
    if (
      tvlChangeEl &&
      data.current_tvl !== undefined &&
      data.previous_tvl !== undefined
    ) {
      const tvlChange =
        ((data.current_tvl - data.previous_tvl) / data.previous_tvl) * 100;
      tvlChangeEl.textContent = this.formatPercentage(tvlChange / 100);
      tvlChangeEl.className = `stream-change price-change ${tvlChange >= 0 ? 'positive' : 'negative'}`;
    }

    // Update Volume
    const volumeEl = document.getElementById('stream-volume');
    if (volumeEl && data.volume !== undefined) {
      volumeEl.textContent = this.formatNumber(data.volume);
    }

    // Update Block Time
    const blockTimeEl = document.getElementById('stream-block-time');
    const blockTimeRawEl = document.getElementById('stream-block-time-raw');
    if (blockTimeEl && blockTimeRawEl && data.block_time !== undefined) {
      const blockDate = new Date(data.block_time * 1000);
      blockTimeEl.textContent = blockDate.toLocaleTimeString();
      blockTimeRawEl.textContent = `Unix: ${data.block_time}`;
    }

    // Update main timestamp
    const timestampEl = document.getElementById('stream-timestamp');
    if (timestampEl && data.block_time !== undefined) {
      const blockDate = new Date(data.block_time * 1000);
      timestampEl.textContent = `Trade at ${blockDate.toLocaleString()}`;
    }

    // Update data type indicator
    const dataTypeEl = document.getElementById('stream-data-type');
    if (dataTypeEl) {
      dataTypeEl.textContent = 'Trading Event';
    }

    debugLog('🎨 Widget update completed');
  }

  private updateStreamStatus(
    status: 'connecting' | 'connected' | 'error' | 'addon-error'
  ) {
    const statusEl = document.getElementById('stream-status');
    const retryBtn = document.getElementById('stream-retry');

    if (!statusEl) return;

    // Clear any existing status classes
    statusEl.className = '';

    switch (status) {
      case 'connecting':
        statusEl.innerHTML = '🟡 CONNECTING...';
        statusEl.className = 'stream-status-connecting';
        if (retryBtn) retryBtn.style.display = 'none';
        break;
      case 'connected':
        statusEl.innerHTML = '🟢 LIVE STREAM';
        statusEl.className = 'stream-status-connected';
        if (retryBtn) retryBtn.style.display = 'none';
        break;
      case 'error':
        statusEl.innerHTML = '🔴 CONNECTION ERROR';
        statusEl.className = 'stream-status-error';
        if (retryBtn) retryBtn.style.display = 'inline-block';
        break;
      case 'addon-error':
        statusEl.innerHTML = '🟠 STREAMING ADDON REQUIRED';
        statusEl.className = 'stream-status-addon-error';
        this.showAddonMessage();
        if (retryBtn) retryBtn.style.display = 'none';
        break;
    }

    debugLog(`Stream status updated to: ${status}`);
  }

  private showAddonMessage() {
    // Update the widget content to show addon information
    const widget = document.getElementById('stream-widget');
    if (!widget) return;

    // Hide the normal stream content and show addon message
    const streamContent = widget.querySelector('.stream-content');
    const streamFooter = widget.querySelector('.stream-footer');

    if (streamContent) {
      streamContent.innerHTML = `
        <div class="addon-message">
          <div class="addon-message-header">
            <strong>Streaming Not Available</strong>
          </div>
          <div class="addon-message-content">
            <p>Stream addons are only available for the Aggregate DEX and it seems like your plan doesn't contain any addons.</p>
            <p>You should buy addons to show the streaming information here. Streaming requires the <strong>Token Price SSE Stream</strong> addon available on Hobby and Developer plans.</p>
            <div class="addon-message-actions">
              <a href="https://charli3.io/api" target="_blank" rel="noopener noreferrer" class="addon-upgrade-link">
                Upgrade Your Plan
              </a>
            </div>
          </div>
        </div>
      `;
    }

    if (streamFooter) {
      streamFooter.innerHTML = `
        <span>Chart data is still available - streaming is an optional feature</span>
      `;
    }
  }

  private checkConnectionHealth() {
    // If no data received in 90 seconds, assume connection is dead
    if (this.isConnected && Date.now() - this.lastDataTime > 90000) {
      console.warn('⚠️ Stream connection appears to be dead, reconnecting...');
      this.isConnected = false;
      this.updateStreamStatus('error');

      if (this.currentPoolId) {
        // Wait a bit before reconnecting
        setTimeout(() => {
          if (this.currentPoolId) {
            void this.startStream(this.currentPoolId);
          }
        }, 5000);
      }
    }
  }

  stopStream() {
    debugLog('🛑 stopStream called');

    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }

    this.isConnected = false;
    this.currentPoolId = null;
    this.lastDataTime = 0;
    this.reconnectAttempts = 0;

    debugLog('🛑 Stream stopped');
  }

  // Reset addon error state (useful when user updates credentials)
  resetAddonErrorState() {
    this.isAddonErrorDetected = false;
    this.addonErrorAttempts = 0;
    debugLog('🔄 Addon error state reset');
  }

  hideStreamWidget() {
    debugLog('🙈 hideStreamWidget called');

    const widget = document.getElementById('stream-widget');
    if (widget) {
      widget.classList.add('hidden');
      widget.style.display = 'none';
    }

    // Also stop the stream when hiding
    this.stopStream();
    debugLog('🙈 Widget hidden and stream stopped');
  }

  showStreamWidget() {
    debugLog('👁️ showStreamWidget called');

    const widget = document.getElementById('stream-widget');
    debugLog('👁️ Widget element found:', !!widget);

    if (widget) {
      // Remove hidden class and force display
      widget.classList.remove('hidden');
      widget.style.display = 'block';

      debugLog('👁️ Widget made visible');
      debugLog('👁️ Widget classes:', widget.className);
      debugLog('👁️ Widget display style:', widget.style.display);

      // Reset widget content to defaults and collapse by default
      this.resetWidgetContent();
      this.collapseStreamContent();
    } else {
      console.error('👁️ Widget element not found in DOM!');
    }
  }

  private resetWidgetContent() {
    debugLog('🔄 Resetting widget content to defaults');

    // Reset all widget values to defaults - updated for new fields
    const elements = [
      { id: 'stream-pool-id-short', value: '--' },
      { id: 'stream-pool-id-full', value: '--' },
      { id: 'stream-current-price', value: '--' },
      { id: 'stream-previous-price', value: '--' },
      { id: 'stream-price-change', value: '--' },
      { id: 'stream-current-tvl', value: '--' },
      { id: 'stream-previous-tvl', value: '--' },
      { id: 'stream-tvl-change', value: '--' },
      { id: 'stream-volume', value: '--' },
      { id: 'stream-block-time', value: '--' },
      { id: 'stream-block-time-raw', value: '--' },
      { id: 'stream-timestamp', value: 'Waiting for data...' },
      { id: 'stream-data-type', value: '--' },
    ];

    elements.forEach(({ id, value }) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = value;
        // Reset classes for change indicators
        if (id.includes('change')) {
          el.className = 'stream-change price-change';
        }
      }
    });

    // Set initial status
    this.updateStreamStatus('connecting');
  }

  // Collapse stream content by default
  private collapseStreamContent() {
    const contentWrapper = document.getElementById('stream-content-wrapper');
    const chevron = document.getElementById('stream-chevron');

    if (contentWrapper && chevron) {
      contentWrapper.classList.add('collapsed');
      chevron.classList.remove('expanded');
      debugLog('🔽 Stream content collapsed by default');
    }
  }

  // Public method to force reconnection
  reconnect() {
    debugLog('🔄 Manual reconnection requested');
    if (this.currentPoolId) {
      this.reconnectAttempts = 0; // Reset attempts
      void this.startStream(this.currentPoolId);
    }
  }

  // Cleanup method
  destroy() {
    this.stopStream();
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  // Helper methods
  private formatPrice(price: number): string {
    if (price < 0.00001 && price > 0) {
      return price.toExponential(8);
    }
    if (price < 1 && price > 0) {
      return price.toFixed(8).replace(/\.?0+$/, '');
    }
    return price.toFixed(6).replace(/\.?0+$/, '');
  }

  private formatPercentage(value: number): string {
    const percentage = (value * 100).toFixed(2);
    return `${value >= 0 ? '+' : ''}${percentage}%`;
  }

  private formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }
}

// Create and export the global instance
export const streamManager = new TokenStreamManager();
