import { TokenService } from '../services/token.js';
import { Utils } from '../utils/helpers.js';
import { Formatters } from '../utils/formatters.js';
import { debugLog } from '../utils/debug.js';
import type { TokenData, SearchResult } from '../types/index.js';

export class SearchComponent {
  private currentSearchController: AbortController | null = null;
  private lastSearchQuery = '';
  private symbolsData: any = null;
  private selectedDex = 'Aggregate';

  private tokenService: TokenService;
  private onTokenSelect: (token: TokenData) => void;
  constructor(
    tokenService: TokenService,
    onTokenSelect: (token: TokenData) => void
  ) {
    this.tokenService = tokenService;
    this.onTokenSelect = onTokenSelect;
  }

  initialize() {
    const searchInput = document.getElementById(
      'search-input'
    ) as HTMLInputElement;
    const searchButton = document.getElementById(
      'search-button'
    ) as HTMLButtonElement;
    const searchResults = document.getElementById(
      'search-results'
    ) as HTMLElement;

    if (searchInput) {
      // Only search on Enter key, not on every keystroke
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          void this.performSearch();
        }
      });
    }

    if (searchButton) {
      // Search when button is clicked
      searchButton.addEventListener('click', () => {
        void this.performSearch();
      });
    }

    if (searchResults) {
      searchResults.addEventListener(
        'click',
        this.handleResultClick.bind(this)
      );
    }

    document.addEventListener('click', e => {
      const searchContainer = document.querySelector('.search-container');
      if (!searchContainer?.contains(e.target as Node)) {
        this.hideResults();
      }
    });

    debugLog('🔍 Search component initialized with manual search trigger');
  }

  setDex(dex: string, symbolsData: any) {
    this.symbolsData = symbolsData;
    this.selectedDex = dex;

    debugLog(`🔍 Search component updated for DEX: ${dex}`, {
      hasSymbolsData: !!symbolsData,
      symbolCount: symbolsData?.symbol?.length || 0,
    });
  }

  private async performSearch() {
    const searchInput = document.getElementById(
      'search-input'
    ) as HTMLInputElement;
    const searchButton = document.getElementById(
      'search-button'
    ) as HTMLButtonElement;

    if (!searchInput) return;

    const query = searchInput.value.trim();

    if (query.length < 2) {
      this.hideResults();
      return;
    }

    if (query === this.lastSearchQuery) return;
    this.lastSearchQuery = query;

    if (this.currentSearchController) {
      this.currentSearchController.abort();
    }
    this.currentSearchController = new AbortController();

    // Update button state to show loading
    if (searchButton) {
      searchButton.disabled = true;
      searchButton.textContent = '⏳ Searching...';
    }

    debugLog(
      `🔍 Starting manual search for: "${query}" in DEX: ${this.selectedDex}`
    );

    try {
      // Check if we have symbols data
      if (!this.symbolsData) {
        debugLog('❌ No symbols data available for search');
        this.showSearchError(
          'No data available. Please wait for data to load.'
        );
        return;
      }

      const results = await this.tokenService.searchTokens(
        query,
        this.symbolsData,
        this.selectedDex
      );

      if (this.currentSearchController?.signal.aborted) return;

      debugLog(`🔍 Search found ${results.length} initial results`);

      // Enrich with TVL - keep all results but limit API calls intelligently
      await this.tokenService.enrichWithTVL(
        results,
        Math.min(results.length, 20)
      );

      debugLog(`🔍 Search completed with TVL data`);
      this.displayResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      this.showSearchError(
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      this.currentSearchController = null;

      // Reset button state
      if (searchButton) {
        searchButton.disabled = false;
        searchButton.textContent = '🔍 Search';
      }
    }
  }

  private displayResults(results: SearchResult[]) {
    const searchResultsEl = document.getElementById('search-results')!;

    if (results.length === 0) {
      debugLog('🔍 No search results found');
      this.showNoResults();
      return;
    }

    debugLog(`🔍 Displaying ${results.length} search results`);

    const sortedResults = [...results].sort(
      (a, b) => (b.tvl || 0) - (a.tvl || 0)
    );

    searchResultsEl.innerHTML = sortedResults
      .map(result => {
        const assetNameReadable =
          Utils.hexToAscii(result.asset_name) || result.asset_name;
        const tvlDisplay = result.tvl
          ? `TVL: ${Formatters.formatNumber(result.tvl)}`
          : '';

        // Clean up the pair display - remove hash parts
        const cleanPair = this.cleanPairName(result.pair);

        return `
          <div class="search-result-item"
               data-ticker="${result.ticker}"
               data-dex="${this.selectedDex}"
               data-policy-id="${result.policy_id}"
               data-asset-name="${result.asset_name}"
               data-pair="${result.pair}"
               data-base-currency="${result.base_currency}">
            <div class="token-pair">
              <span class="dex-name">[${this.selectedDex}]</span>
              ${cleanPair}
            </div>
            <div class="token-details">
              <div class="token-detail">
                <span class="detail-label">policy_id:</span>
                <span>${Utils.truncateString(result.policy_id)}</span>
              </div>
              <div class="token-detail">
                <span class="detail-label">token_name:</span>
                <span>${Utils.truncateString(assetNameReadable)}</span>
              </div>
              <div class="tvl-preview">${tvlDisplay}</div>
            </div>
          </div>
        `;
      })
      .join('');

    searchResultsEl.classList.add('active');
  }

  private cleanPairName(pair: string): string {
    // Split by dot to get base and quote
    const [base, quote] = pair.split('.');

    if (!quote) return pair;

    // Remove hash-like suffixes (anything after underscore that looks like a hash)
    const cleanBase = this.removeHashSuffix(base);
    const cleanQuote = this.removeHashSuffix(quote);

    return `${cleanBase}.${cleanQuote}`;
  }

  private removeHashSuffix(token: string): string {
    // If token contains underscore followed by what looks like a hash (long alphanumeric), remove it
    const hashPattern = /_[a-fA-F0-9]{8,}$/;
    if (hashPattern.test(token)) {
      return token.split('_')[0];
    }

    // Also remove common hash patterns like _abc123, _def456, etc.
    const shortHashPattern = /_[a-zA-Z0-9]{6,}$/;
    if (shortHashPattern.test(token)) {
      const parts = token.split('_');
      // Only remove if the suffix looks like a hash (not a meaningful name)
      const suffix = parts[parts.length - 1];
      if (!/^(USD|EUR|BTC|ETH|ADA|USDC|USDT)$/i.test(suffix)) {
        return parts.slice(0, -1).join('_');
      }
    }

    return token;
  }

  private async handleResultClick(e: Event) {
    const item = (e.target as Element).closest('.search-result-item');
    if (!item) return;

    const tokenData: TokenData = {
      ticker: item.getAttribute('data-ticker')!,
      policy_id: item.getAttribute('data-policy-id')!,
      asset_name: item.getAttribute('data-asset-name')!,
      dex: item.getAttribute('data-dex')!,
      pair: item.getAttribute('data-pair')!, // Keep original pair for API calls
      base_currency: item.getAttribute('data-base-currency') || '',
    };

    debugLog(`🔍 Token selected:`, tokenData);

    item.classList.add('loading');

    try {
      await this.onTokenSelect(tokenData);
      this.hideResults();
      this.clearSearchInput();
    } catch (error) {
      console.error('Error selecting token:', error);
      item.classList.add('error');
      setTimeout(() => item.classList.remove('error'), 3000);
    } finally {
      item.classList.remove('loading');
    }
  }

  private hideResults() {
    const searchResultsEl = document.getElementById('search-results')!;
    searchResultsEl.classList.remove('active');
    searchResultsEl.innerHTML = '';
  }

  private clearSearchInput() {
    const searchInput = document.getElementById(
      'search-input'
    ) as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
      this.lastSearchQuery = '';
    }
  }

  private showNoResults() {
    const searchResultsEl = document.getElementById('search-results')!;
    searchResultsEl.innerHTML = `
      <div class="search-no-results">
        <div class="no-results-icon">🔍</div>
        <div class="no-results-text">No tokens found</div>
        <div class="no-results-suggestion">Try a different search term</div>
      </div>
    `;
    searchResultsEl.classList.add('active');
  }

  private showSearchError(message: string) {
    const searchResultsEl = document.getElementById('search-results')!;
    searchResultsEl.innerHTML = `
      <div class="search-error">
        ⚠️ Search failed: ${message}
        <button onclick="this.parentElement.parentElement.classList.remove('active')">Close</button>
      </div>
    `;
    searchResultsEl.classList.add('active');
  }
}
