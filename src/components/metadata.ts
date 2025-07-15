import { fetchTokenLogo } from '../api/index.js';
import { Utils } from '../utils/helpers.js';
import { Formatters } from '../utils/formatters.js';
import { debugLog } from '../utils/debug.js';
import adaLogoUrl from '../../assets/ada_logo.png';
import type { TokenData } from '../types/index.js';

export class MetadataComponent {
  async update(tokenData: TokenData, currentTokenData?: any) {
    const panelEl = document.getElementById('token-info-panel')!;
    panelEl.classList.remove('hidden');

    const [base, quote] = tokenData.pair.split('.');

    debugLog(`🖼️ Loading logos for pair: ${tokenData.pair}`);

    await this.updateLogos(
      base,
      quote,
      tokenData.base_currency || 'Unknown',
      tokenData.policy_id,
      tokenData.asset_name
    );
    this.updateTokenInfo(tokenData, currentTokenData);
  }

  private async updateLogos(
    base: string,
    quote: string,
    baseCurrency: string,
    policyId: string,
    assetName: string
  ) {
    const baseSymbolEl = document.getElementById('base-token-symbol')!;
    const quoteSymbolEl = document.getElementById('quote-token-symbol')!;
    const baseLogoEl = document.getElementById(
      'base-token-logo'
    ) as HTMLImageElement;
    const quoteLogoEl = document.getElementById(
      'quote-token-logo'
    ) as HTMLImageElement;

    baseSymbolEl.textContent = base || '-';
    quoteSymbolEl.textContent = quote || '-';

    baseSymbolEl.style.display = 'block';
    quoteSymbolEl.style.display = 'block';
    baseLogoEl.style.display = 'none';
    quoteLogoEl.style.display = 'none';

    const quoteCurrency = Utils.parseCurrency(`${policyId}${assetName}`);
    const baseCurrencyParsed = Utils.parseCurrency(baseCurrency);

    // Load base token logo
    try {
      let baseLogoUrl: string | null = null;

      if (base === 'ADA') {
        baseLogoUrl = adaLogoUrl;
      } else if (baseCurrencyParsed.policyId) {
        baseLogoUrl = await this.loadTokenLogo(
          baseCurrencyParsed.policyId,
          baseCurrencyParsed.assetName
        );
      }

      if (baseLogoUrl) {
        baseLogoEl.src = baseLogoUrl;
        baseLogoEl.style.display = 'block';
        baseSymbolEl.style.display = 'none';
      }
    } catch (error) {
      console.error(`Error loading base logo:`, error);
    }

    // Load quote token logo
    try {
      let quoteLogoUrl: string | null = null;

      if (quote === 'ADA') {
        quoteLogoUrl = adaLogoUrl;
      } else if (quoteCurrency.policyId) {
        quoteLogoUrl = await this.loadTokenLogo(
          quoteCurrency.policyId,
          quoteCurrency.assetName
        );
      }

      if (quoteLogoUrl) {
        quoteLogoEl.src = quoteLogoUrl;
        quoteLogoEl.style.display = 'block';
        quoteSymbolEl.style.display = 'none';
      }
    } catch (error) {
      console.error(`Error loading quote logo:`, error);
    }
  }

  private async loadTokenLogo(
    policyId: string,
    assetName: string
  ): Promise<string | null> {
    if (!policyId || policyId.length < 56) {
      return adaLogoUrl;
    }

    try {
      const blob = await fetchTokenLogo(policyId, assetName);
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Failed to fetch logo:`, error);
      return null;
    }
  }

  private updateTokenInfo(tokenData: TokenData, currentTokenData?: any) {
    document.getElementById('token-pair')!.textContent = tokenData.pair;
    document.getElementById('policy-id')!.textContent = tokenData.policy_id;
    document.getElementById('token-name')!.textContent =
      Utils.hexToAscii(tokenData.asset_name) || tokenData.asset_name;

    if (currentTokenData) {
      const priceEl = document.getElementById('current-price')!;
      const priceChangeEl = document.getElementById('price-change')!;
      priceEl.textContent = currentTokenData.current_price
        ? Formatters.formatPrice(currentTokenData.current_price)
        : '--';

      if (currentTokenData.daily_price_change !== undefined) {
        priceChangeEl.textContent = Formatters.formatPercentage(
          currentTokenData.daily_price_change
        );
        priceChangeEl.className = `price-change ${currentTokenData.daily_price_change >= 0 ? 'positive' : 'negative'}`;
      }

      const tvlEl = document.getElementById('current-tvl')!;
      const tvlChangeEl = document.getElementById('tvl-change')!;
      tvlEl.textContent = currentTokenData.current_tvl
        ? Formatters.formatNumber(currentTokenData.current_tvl)
        : '--';

      if (currentTokenData.daily_tvl_change !== undefined) {
        const tvlChangePercent =
          currentTokenData.current_tvl > 0
            ? currentTokenData.daily_tvl_change / currentTokenData.current_tvl
            : 0;
        tvlChangeEl.textContent = Formatters.formatPercentage(tvlChangePercent);
        tvlChangeEl.className = `price-change ${currentTokenData.daily_tvl_change >= 0 ? 'positive' : 'negative'}`;
      }

      const volumeEl = document.getElementById('daily-volume')!;
      volumeEl.textContent = currentTokenData.daily_volume
        ? Formatters.formatNumber(currentTokenData.daily_volume)
        : '--';
    }
  }
}
