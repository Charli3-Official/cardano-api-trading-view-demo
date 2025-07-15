import { getSymbolInfo, fetchCurrentTokenData } from '../api/index.js';
import { CacheManager } from '../cache/manager.js';
import { APIQueue } from './api-queue.js';
import { CACHE_CONFIG, APP_CONFIG } from '../config.js';
import { debugLog } from '../utils/debug.js';
import type { SearchResult } from '../types/index.js';

export class TokenService {
  private apiQueue = new APIQueue();

  private cacheManager: CacheManager;
  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  async getSymbols(group: string) {
    const cacheKey = `symbols_${group}`;
    console.log(`🔍 TokenService.getSymbols called for group: ${group}`);
    debugLog(`Fetching data for cache key: ${cacheKey}`);

    if (!(await this.cacheManager.isExpired('symbols', group))) {
      const cached = await this.cacheManager.get('symbols', group);
      if (cached) {
        console.log(`✅ Using cached symbols for ${group} - NO API CALL`);
        debugLog(`✅ Using cached symbols for ${group}`);
        return cached;
      }
    }

    console.log(`🌐 Making fresh API call for symbols data for ${group}`);
    debugLog(`🌐 Fetching fresh symbols data for ${group}`);
    const symbolsData = await getSymbolInfo(group);

    await this.cacheManager.setWithExpiry(
      'symbols',
      group,
      symbolsData,
      CACHE_CONFIG.SYMBOLS_EXPIRY
    );

    console.log(
      `💾 Cached symbols data for ${group} (${symbolsData?.symbol?.length || 0} symbols)`
    );
    return symbolsData;
  }

  async getCurrentTokenData(policyId: string, assetName: string) {
    const cacheKey = `${policyId}${assetName}`;

    const memoryData = this.cacheManager.getMemory(cacheKey);
    if (memoryData) {
      return memoryData;
    }

    return this.apiQueue.add(async () => {
      try {
        const data = await fetchCurrentTokenData(policyId, assetName);
        this.cacheManager.setMemory(
          cacheKey,
          data,
          CACHE_CONFIG.TOKEN_DATA_EXPIRY
        );
        return data;
      } catch (error) {
        console.error(`Failed to fetch current token data:`, error);
        return null;
      }
    });
  }

  async searchTokens(
    query: string,
    symbolsData: any,
    selectedDex: string
  ): Promise<SearchResult[]> {
    debugLog(`🔍 TokenService.searchTokens called`, {
      query,
      selectedDex,
      hasSymbolsData: !!symbolsData,
      symbolsDataKeys: symbolsData ? Object.keys(symbolsData) : [],
      symbolCount: symbolsData?.symbol?.length || 0,
    });

    const results: Array<SearchResult & { matchScore?: number }> = [];

    if (query.length < 2) {
      debugLog('🔍 Query too short, returning empty results');
      return results;
    }

    const searchLower = query.toLowerCase();

    if (!symbolsData?.symbol || !Array.isArray(symbolsData.symbol)) {
      debugLog('❌ Invalid symbols data structure', {
        hasSymbol: !!symbolsData?.symbol,
        symbolType: typeof symbolsData?.symbol,
        isArray: Array.isArray(symbolsData?.symbol),
      });
      return results;
    }

    debugLog(`🔍 Searching through ${symbolsData.symbol.length} symbols`);

    for (let i = 0; i < symbolsData.symbol.length; i++) {
      const symbol = symbolsData.symbol[i];
      const ticker = symbolsData.ticker[i];
      const currency = symbolsData.currency[i];
      const baseCurrency = symbolsData['base-currency']?.[i] || '';

      if (!symbol || !ticker || !currency) continue;

      const [base, quote] = symbol.split('.');
      let matchFound = false;
      let matchScore = 0;

      // Scoring logic
      if (symbol.toLowerCase() === searchLower) {
        matchFound = true;
        matchScore = 100;
      } else if (symbol.toLowerCase().startsWith(searchLower)) {
        matchFound = true;

        matchScore = 90;
      } else if (symbol.toLowerCase().includes(searchLower)) {
        matchFound = true;
        matchScore = 80;
      } else if (
        (base && base.toLowerCase().includes(searchLower)) ||
        (quote && quote.toLowerCase().includes(searchLower))
      ) {
        matchFound = true;
        matchScore = 70;
      } else if (ticker.toLowerCase().includes(searchLower)) {
        matchFound = true;
        matchScore = 60;
      }

      if (matchFound && currency && currency.length >= 56) {
        const policy_id = currency.substring(0, 56);
        const asset_name = currency.substring(56);

        results.push({
          dex: selectedDex,
          ticker,
          pair: symbol,
          policy_id,
          asset_name,
          base_currency: baseCurrency,
          currency,
          matchScore,
        });
      }
    }

    debugLog(`🔍 Found ${results.length} matching tokens before sorting`);

    // Sort and limit
    results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    const limitedResults = results.slice(0, APP_CONFIG.MAX_SEARCH_RESULTS);

    debugLog(`🔍 Returning ${limitedResults.length} results after limiting`);

    // Remove matchScore property
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return limitedResults.map(({ matchScore, ...token }) => token);
  }

  async enrichWithTVL(
    results: SearchResult[],
    maxResults: number = 20
  ): Promise<void> {
    const actualMax = Math.min(results.length, maxResults);
    console.log(
      `💰 Enriching ${actualMax} search results with TVL data (this will make up to ${actualMax} API calls)`
    );
    debugLog(`💰 Enriching ${actualMax} results with TVL data`);

    const tvlPromises = results
      .slice(0, maxResults)
      .map(async (result, index) => {
        try {
          console.log(
            `💰 TVL API call ${index + 1}/${actualMax} for token: ${result.ticker}`
          );
          const tokenData = await this.getCurrentTokenData(
            result.policy_id,
            result.asset_name
          );
          if (tokenData?.current_tvl) {
            result.tvl = tokenData.current_tvl;
            debugLog(`💰 TVL found for ${result.ticker}: ${result.tvl}`);
          } else {
            result.tvl = 0;
          }
        } catch (error) {
          console.log(`❌ TVL API call failed for ${result.ticker}:`, error);
          debugLog(`❌ Failed to get TVL for ${result.ticker}:`, error);
          result.tvl = 0;
        }
      });

    await Promise.allSettled(tvlPromises);
    console.log(`💰 TVL enrichment completed for ${actualMax} tokens`);
    debugLog(`💰 TVL enrichment completed`);
  }
}
