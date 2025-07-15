import { Utils } from '../utils/helpers.js';
import { Formatters } from '../utils/formatters.js';
import { TIMEZONES, APP_CONFIG } from '../config.js';
import { debugLog } from '../utils/debug.js';

export class ControlsComponent {
  private selectedTimezone = APP_CONFIG.DEFAULT_TIMEZONE;

  private onTimeRangeChange: () => void;
  private onTimezoneChange: (timezone: string) => void;
  constructor(
    onTimeRangeChange: () => void,
    onTimezoneChange: (timezone: string) => void
  ) {
    this.onTimeRangeChange = onTimeRangeChange;
    this.onTimezoneChange = onTimezoneChange;
  }
  initialize() {
    this.setupResolutionControl();
    this.setupDateControls();
    this.setupTimezoneControl();
  }

  private setupDateControls() {
    const fromInput = document.getElementById('from-date') as HTMLInputElement;
    const toInput = document.getElementById('to-date') as HTMLInputElement;

    if (fromInput) {
      fromInput.addEventListener('change', () => {
        this.updateResolutionOptions();
        this.onTimeRangeChange();
      });
    }

    if (toInput) {
      toInput.addEventListener('change', () => {
        this.updateResolutionOptions();
        this.onTimeRangeChange();
      });
    }
  }

  private setupTimezoneControl() {
    const timezoneSelect = document.getElementById(
      'timezone-select'
    ) as HTMLSelectElement;

    if (timezoneSelect) {
      const savedTimezone = localStorage.getItem('timezone');
      if (savedTimezone) {
        this.selectedTimezone = savedTimezone;
      }

      TIMEZONES.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz;
        option.textContent = tz.replace('_', ' ');
        if (tz === this.selectedTimezone) {
          option.selected = true;
        }
        timezoneSelect.appendChild(option);
      });

      timezoneSelect.addEventListener('change', () => {
        this.selectedTimezone = timezoneSelect.value;
        localStorage.setItem('timezone', this.selectedTimezone);
        this.onTimezoneChange(this.selectedTimezone);
        this.updateDateInputsTimezone();
      });
    }
  }

  updateResolutionOptions() {
    debugLog('🔧 Updating resolution options');

    const fromInput = document.getElementById('from-date') as HTMLInputElement;
    const toInput = document.getElementById('to-date') as HTMLInputElement;
    const resolutionSelect = document.getElementById(
      'resolution-select'
    ) as HTMLSelectElement;

    if (!fromInput.value || !toInput.value) {
      return;
    }

    const fromDate = new Date(fromInput.value);
    const toDate = new Date(toInput.value);
    const from = Math.floor(fromDate.getTime() / 1000);
    const to = Math.floor(toDate.getTime() / 1000);

    if (from >= to) {
      const barsCountEl = document.getElementById('bars-count');
      if (barsCountEl) {
        barsCountEl.textContent = 'Invalid range';
        barsCountEl.className = 'bars-warning';
      }
      return;
    }

    const { valid, invalid, suggestions } = Utils.getValidResolutions(from, to);
    const currentResolution = resolutionSelect.value;

    Array.from(resolutionSelect.options).forEach(option => {
      const resolution = option.value;
      const bars = Utils.calculateBars(from, to, resolution);

      if (valid.includes(resolution)) {
        option.disabled = false;
        const currentText = option.textContent || '';
        option.textContent = currentText.split(' (')[0];
        option.title = `${bars} bars`;
      } else if (invalid.includes(resolution)) {
        option.disabled = true;
        const currentText = option.textContent || '';
        const baseText = currentText.split(' (')[0];
        option.textContent = `${baseText} (${bars} bars - locked)`;
        option.title = `${suggestions[resolution]} (currently ${bars} bars, max 240)`;
      }
    });

    // Auto-select better resolution if current is invalid
    if (invalid.includes(currentResolution) && valid.length > 0) {
      const timeRangeHours = (to - from) / 3600;
      let bestResolution = valid[0];

      if (timeRangeHours <= 4) {
        bestResolution =
          valid.find(r => r === '1min') ||
          valid.find(r => r === '5min') ||
          valid[0];
      } else if (timeRangeHours <= 24) {
        bestResolution =
          valid.find(r => r === '5min') ||
          valid.find(r => r === '15min') ||
          valid[0];
      } else if (timeRangeHours <= 168) {
        bestResolution =
          valid.find(r => r === '15min') ||
          valid.find(r => r === '60min') ||
          valid[0];
      } else {
        bestResolution =
          valid.find(r => r === '60min') ||
          valid.find(r => r === '1d') ||
          valid[0];
      }

      if (bestResolution !== currentResolution) {
        resolutionSelect.value = bestResolution;
        this.onTimeRangeChange();
      }
    }

    // Update bars count
    const bars = Utils.calculateBars(from, to, resolutionSelect.value);
    const barsCountEl = document.getElementById('bars-count');
    if (barsCountEl) {
      barsCountEl.textContent = bars.toString();
      barsCountEl.className =
        bars > 240 ? 'bars-warning' : bars === 0 ? 'bars-warning' : '';
    }
  }

  private updateDateInputsTimezone() {
    const fromInput = document.getElementById('from-date') as HTMLInputElement;
    const toInput = document.getElementById('to-date') as HTMLInputElement;

    if (fromInput.value && toInput.value) {
      const fromDate = new Date(fromInput.value);
      const toDate = new Date(toInput.value);

      fromInput.value = Formatters.formatDateForInput(
        fromDate,
        this.selectedTimezone
      );
      toInput.value = Formatters.formatDateForInput(
        toDate,
        this.selectedTimezone
      );
    }
  }

  getTimeRange() {
    const fromInput = document.getElementById('from-date') as HTMLInputElement;
    const toInput = document.getElementById('to-date') as HTMLInputElement;
    const resolutionSelect = document.getElementById(
      'resolution-select'
    ) as HTMLSelectElement;

    const from = Math.floor(new Date(fromInput.value).getTime() / 1000);
    const to = Math.floor(new Date(toInput.value).getTime() / 1000);
    const resolution = resolutionSelect.value;

    return { from, to, resolution };
  }

  setDefaultDateRange() {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const fromInput = document.getElementById('from-date') as HTMLInputElement;
    const toInput = document.getElementById('to-date') as HTMLInputElement;

    if (fromInput && toInput) {
      fromInput.value = Formatters.formatDateForInput(
        oneMonthAgo,
        this.selectedTimezone
      );
      toInput.value = Formatters.formatDateForInput(now, this.selectedTimezone);
    }
  }

  public setOptimalDateRangeForResolution(resolution: string) {
    const resolutionConfig =
      APP_CONFIG.RESOLUTION_CONFIG[
        resolution as keyof typeof APP_CONFIG.RESOLUTION_CONFIG
      ];

    if (!resolutionConfig) return;

    const now = new Date();
    const optimalSeconds = resolutionConfig.optimalTimeRange;
    const fromDate = new Date(now.getTime() - optimalSeconds * 1000);

    const fromInput = document.getElementById('from-date') as HTMLInputElement;
    const toInput = document.getElementById('to-date') as HTMLInputElement;

    if (fromInput && toInput) {
      fromInput.value = Formatters.formatDateForInput(
        fromDate,
        this.selectedTimezone
      );
      toInput.value = Formatters.formatDateForInput(now, this.selectedTimezone);

      debugLog(
        `📅 Set optimal range for ${resolution}: ${optimalSeconds / 3600}h`
      );
    }
  }

  private setupResolutionControl() {
    const resolutionSelect = document.getElementById(
      'resolution-select'
    ) as HTMLSelectElement;

    if (resolutionSelect) {
      resolutionSelect.addEventListener('change', () => {
        // Automatically set optimal date range for new resolution
        this.setOptimalDateRangeForResolution(resolutionSelect.value);
        this.updateResolutionOptions();
        this.onTimeRangeChange();
      });
    }
  }
}
