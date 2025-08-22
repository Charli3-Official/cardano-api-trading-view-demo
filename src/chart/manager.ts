import {
  createChart,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  DeepPartial,
  ChartOptions,
} from 'lightweight-charts';
import { APP_CONFIG } from '../config.js';
import { Formatters } from '../utils/formatters.js';
import { debugLog } from '../utils/debug.js';
import type {
  HistoricalData,
  CandlestickDataPoint,
  VolumeDataPoint,
} from '../types/index.js';

export class ChartManager {
  private chart: IChartApi | null = null;
  private candlestickSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;
  private currentTheme = 'dark';
  private selectedTimezone = APP_CONFIG.DEFAULT_TIMEZONE;

  initialize(containerId: string = 'chart') {
    const container = document.getElementById(containerId) as HTMLDivElement;
    if (!container) {
      throw new Error(`Chart container '${containerId}' not found`);
    }

    this.chart = createChart(container, this.getChartOptions());
    this.setupTooltip(container);
    this.setupResize(container);

    debugLog('📊 Chart initialized');
  }

  async updateChart(historicalData: HistoricalData, resolution: string) {
    if (!this.chart) {
      throw new Error('Chart not initialized');
    }

    if (historicalData?.t?.length > 0) {
      console.log('📊 API returned data from:', {
        firstDate: new Date(historicalData.t[0] * 1000),
        lastDate: new Date(
          historicalData.t[historicalData.t.length - 1] * 1000
        ),
        totalPoints: historicalData.t.length,
      });
    }
    try {
      debugLog('📊 Updating chart with new data');

      const candlestickData = this.processCandlestickData(historicalData);
      const volumeData = this.processVolumeData(historicalData);

      this.clearSeries();

      this.candlestickSeries = this.chart.addSeries(CandlestickSeries, {
        upColor: '#3fb950',
        downColor: '#f85149',
        borderUpColor: '#3fb950',
        borderDownColor: '#f85149',
        wickUpColor: '#3fb950',
        wickDownColor: '#f85149',
        priceFormat: {
          type: 'custom',
          formatter: (price: number) => Formatters.formatPrice(price),
        },
      });

      // @ts-ignore
      this.candlestickSeries.setData(candlestickData);

      if (volumeData && volumeData.length > 0) {
        this.volumeSeries = this.chart.addSeries(HistogramSeries, {
          color: '#26a69a',
          priceScaleId: '',
        });

        this.volumeSeries.priceScale().applyOptions({
          scaleMargins: { top: 0.85, bottom: 0 },
        });

        // @ts-ignore
        this.volumeSeries.setData(volumeData);
      }

      this.configurePriceScale();
      this.configureTimeScale(resolution);

      setTimeout(() => {
        if (this.chart) {
          this.chart.timeScale().fitContent();
        }
      }, 100);

      debugLog('📊 Chart updated successfully');
    } catch (error) {
      console.error('📊 Error updating chart:', error);
      this.showChartError(error);
    }
  }

  updateTheme(theme: string) {
    this.currentTheme = theme;
    if (this.chart) {
      this.chart.applyOptions(this.getChartOptions());
    }
  }

  setTimezone(timezone: string) {
    console.log('🌍 Chart timezone updated:', timezone);
    this.selectedTimezone = timezone;

    // If chart is initialized, we should trigger a redraw of time labels
    if (this.chart) {
      console.log(
        '🔄 Chart exists, timezone change will take effect on next data update'
      );
    }
  }

  private getChartOptions(): DeepPartial<ChartOptions> {
    const isDark = this.currentTheme === 'dark';

    return {
      width: 0,
      height: APP_CONFIG.DEFAULT_CHART_HEIGHT,
      layout: {
        background: { color: isDark ? '#161b22' : '#f6f8fa' },
        textColor: isDark ? '#c9d1d9' : '#24292f',
      },
      grid: {
        vertLines: { color: isDark ? '#30363d' : '#d1d9e0' },
        horzLines: { color: isDark ? '#30363d' : '#d1d9e0' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: isDark ? '#c9d1d9' : '#24292f', style: 2 },
        horzLine: { width: 1, color: isDark ? '#c9d1d9' : '#24292f', style: 2 },
      },
      rightPriceScale: { borderColor: isDark ? '#30363d' : '#d1d9e0' },
      timeScale: {
        borderColor: isDark ? '#30363d' : '#d1d9e0',
        timeVisible: true,
        secondsVisible: false,
      },
    };
  }

  private processCandlestickData(data: HistoricalData): CandlestickDataPoint[] {
    if (!data.t || !Array.isArray(data.t)) {
      throw new Error("Invalid API response: missing 't' property");
    }

    const { t: times, o: opens, h: highs, l: lows, c: closes } = data;

    if (!opens || !highs || !lows || !closes) {
      throw new Error('Missing OHLC data arrays');
    }

    // 🎯 ENHANCED: Process and validate data
    let processedData = times.map((time: number, index: number) => {
      const timestamp = time > 1e10 ? Math.floor(time / 1000) : time;

      return {
        time: timestamp,
        open: Number(opens[index]),
        high: Number(highs[index]),
        low: Number(lows[index]),
        close: Number(closes[index]),
      };
    });

    // Sort by time to ensure proper order
    processedData.sort((a, b) => a.time - b.time);

    // 🎯 SAFETY: Final check - ensure we don't exceed MAX_BARS
    if (processedData.length > APP_CONFIG.MAX_BARS) {
      debugLog(
        `⚠️ API returned ${processedData.length} bars, limiting to ${APP_CONFIG.MAX_BARS}`
      );
      processedData = processedData.slice(-APP_CONFIG.MAX_BARS);
    }

    // 🎯 VALIDATION: Check for invalid data points
    const validData = processedData.filter(
      candle =>
        !isNaN(candle.open) &&
        candle.open > 0 &&
        !isNaN(candle.high) &&
        candle.high > 0 &&
        !isNaN(candle.low) &&
        candle.low > 0 &&
        !isNaN(candle.close) &&
        candle.close > 0 &&
        candle.high >= Math.max(candle.open, candle.close) &&
        candle.low <= Math.min(candle.open, candle.close)
    );

    if (validData.length !== processedData.length) {
      debugLog(
        `⚠️ Filtered out ${processedData.length - validData.length} invalid candles`
      );
    }

    debugLog(`📊 Final processed data: ${validData.length} valid bars`);

    return validData;
  }
  private processVolumeData(data: HistoricalData): VolumeDataPoint[] | null {
    if (!data.v || !Array.isArray(data.v)) return null;

    const { t: times, v: volumes, c: closes, o: opens } = data;

    return times.map((time: number, index: number) => ({
      time,
      value: volumes[index],
      color:
        closes[index] >= opens[index]
          ? 'rgba(63, 185, 80, 0.1)'
          : 'rgba(248, 81, 73, 0.1)',
    }));
  }

  private clearSeries() {
    if (this.candlestickSeries) {
      this.chart!.removeSeries(this.candlestickSeries);
      this.candlestickSeries = null;
    }
    if (this.volumeSeries) {
      this.chart!.removeSeries(this.volumeSeries);
      this.volumeSeries = null;
    }
  }

  private configurePriceScale() {
    if (this.candlestickSeries) {
      this.candlestickSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.05, bottom: 0.25 },
        autoScale: true,
      });
    }
  }

  private configureTimeScale(resolution: string) {
    if (!this.chart) return;

    this.chart.timeScale().applyOptions({
      timeVisible: true,
      secondsVisible: false,
      // @ts-expect-error tickMarkFormatter exists at runtime
      tickMarkFormatter: (time: number) => {
        const date = new Date(time * 1000);

        if (resolution === '1min' || resolution === '5min') {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: this.selectedTimezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          return formatter.format(date);
        } else if (resolution === '15min' || resolution === '60min') {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: this.selectedTimezone,
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          return formatter.format(date);
        } else {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: this.selectedTimezone,
            month: '2-digit',
            day: '2-digit',
          });
          return formatter.format(date);
        }
      },
    });
  }

  private setupTooltip(container: HTMLDivElement) {
    if (!this.chart) return;

    const toolTip = document.createElement('div');
    toolTip.className = 'chart-tooltip';
    toolTip.style.cssText = `
      position: absolute;
      display: none;
      padding: 8px;
      box-sizing: border-box;
      font-size: 12px;
      background-color: ${this.currentTheme === 'dark' ? '#21262d' : '#f0f3f6'};
      color: ${this.currentTheme === 'dark' ? '#c9d1d9' : '#24292f'};
      border: 1px solid ${this.currentTheme === 'dark' ? '#30363d' : '#d1d9e0'};
      border-radius: 4px;
      z-index: 1000;
      pointer-events: none;
    `;
    container.appendChild(toolTip);

    this.chart.subscribeCrosshairMove(param => {
      if (
        !param.time ||
        !param.point ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        toolTip.style.display = 'none';
        return;
      }

      const timestamp = param.time as number;
      const dateStr = new Date(timestamp * 1000).toLocaleString('en-US', {
        timeZone: this.selectedTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Debug logging for timezone issues
      console.log('🕒 Hover timestamp:', {
        utcTimestamp: timestamp,
        timezone: this.selectedTimezone,
        formattedTime: dateStr,
        utcTime: new Date(timestamp * 1000).toUTCString(),
      });

      let content = `<div style="font-weight: 600; margin-bottom: 4px">${dateStr}</div>`;

      if (
        this.candlestickSeries &&
        param.seriesData.has(this.candlestickSeries)
      ) {
        const data = param.seriesData.get(this.candlestickSeries) as any;
        content += `
          <div>O: ${Formatters.formatPrice(data.open)}</div>
          <div>H: ${Formatters.formatPrice(data.high)}</div>
          <div>L: ${Formatters.formatPrice(data.low)}</div>
          <div>C: ${Formatters.formatPrice(data.close)}</div>
        `;
      }

      if (this.volumeSeries && param.seriesData.has(this.volumeSeries)) {
        const data = param.seriesData.get(this.volumeSeries) as any;
        content += `<div style="color: #58a6ff">Volume: ${Formatters.formatNumber(data.value)}</div>`;
      }

      toolTip.innerHTML = content;
      toolTip.style.display = 'block';

      const y = param.point.y;
      let left = param.point.x + 10;
      if (left > container.clientWidth - 200) {
        left = param.point.x - 200;
      }

      let top = y - 10;
      if (top < 0) top = y + 20;

      toolTip.style.left = left + 'px';
      toolTip.style.top = top + 'px';
    });
  }

  private setupResize(container: HTMLDivElement) {
    if (!this.chart) return;

    const resizeHandler = () => {
      if (this.chart) {
        this.chart.applyOptions({ width: container.clientWidth });
      }
    };

    window.addEventListener('resize', resizeHandler);
    this.chart.applyOptions({ width: container.clientWidth });
  }

  private showChartError(error: any) {
    const container = document.getElementById('chart');
    if (container) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary);">
          <div>
            <div style="text-align: center; margin-bottom: 10px;">⚠️ Error loading chart data</div>
            <div style="text-align: center; font-size: 12px;">Please try selecting a different token or time range</div>
            <div style="text-align: center; font-size: 10px; margin-top: 10px; color: var(--text-tertiary);">
              Error: ${error instanceof Error ? error.message : String(error)}
            </div>
          </div>
        </div>
      `;
    }
  }

  destroy() {
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
  }
}
