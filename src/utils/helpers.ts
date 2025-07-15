import { APP_CONFIG } from '../config.js';

export class Utils {
  static truncateString(
    str: string,
    firstN: number = 5,
    lastN: number = 5
  ): string {
    if (str.length <= firstN + lastN) return str;
    return `${str.slice(0, firstN)}...${str.slice(-lastN)}`;
  }

  static hexToAscii(hex: string): string {
    let result = '';
    for (let i = 0; i < hex.length; i += 2) {
      const hexPair = hex.slice(i, i + 2);
      const charCode = parseInt(hexPair, 16);
      if (charCode >= 32 && charCode <= 126) {
        result += String.fromCharCode(charCode);
      }
    }
    return result;
  }

  static parseCurrency(currency: string): {
    policyId: string;
    assetName: string;
  } {
    if (!currency || currency.length < 56) {
      return { policyId: '', assetName: '' };
    }
    return {
      policyId: currency.substring(0, 56),
      assetName: currency.substring(56),
    };
  }

  static calculateBars(from: number, to: number, resolution: string): number {
    const config =
      APP_CONFIG.RESOLUTION_CONFIG[
        resolution as keyof typeof APP_CONFIG.RESOLUTION_CONFIG
      ];
    if (!config) return 0;
    return Math.floor((to - from) / config.interval);
  }

  static getValidResolutions(from: number, to: number) {
    const resolutions = Object.keys(APP_CONFIG.RESOLUTION_CONFIG);
    const valid: string[] = [];
    const invalid: string[] = [];
    const suggestions: { [key: string]: string } = {};

    resolutions.forEach(resolution => {
      const bars = Utils.calculateBars(from, to, resolution);
      if (bars <= APP_CONFIG.MAX_BARS) {
        valid.push(resolution);
      } else {
        invalid.push(resolution);
        const config =
          APP_CONFIG.RESOLUTION_CONFIG[
            resolution as keyof typeof APP_CONFIG.RESOLUTION_CONFIG
          ];
        const maxSeconds = APP_CONFIG.MAX_BARS * config.interval;
        const maxDays = Math.floor(maxSeconds / 86400);
        const maxHours = Math.floor(maxSeconds / 3600);

        if (maxDays >= 1) {
          suggestions[resolution] =
            `Reduce timeframe to ${maxDays} day${maxDays > 1 ? 's' : ''} or less`;
        } else if (maxHours >= 1) {
          suggestions[resolution] =
            `Reduce timeframe to ${maxHours} hour${maxHours > 1 ? 's' : ''} or less`;
        } else {
          const maxMinutes = Math.floor(maxSeconds / 60);
          suggestions[resolution] =
            `Reduce timeframe to ${maxMinutes} minute${maxMinutes > 1 ? 's' : ''} or less`;
        }
      }
    });

    return { valid, invalid, suggestions };
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
