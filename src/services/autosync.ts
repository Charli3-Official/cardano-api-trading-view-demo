import { APP_CONFIG } from '../config.js';
import { Formatters } from '../utils/formatters.js';
import { debugLog } from '../utils/debug.js';

export class AutoSyncService {
  private autoSyncInterval: number | null = null;
  private isEnabled = false;
  private selectedTimezone = APP_CONFIG.DEFAULT_TIMEZONE;

  private onUpdate: () => Promise<void>;
  constructor(onUpdate: () => Promise<void>) {
    this.onUpdate = onUpdate;
  }

  initialize() {
    this.setupControls();
    this.loadSettings();
  }
  private handleCheckboxChange = (e: Event) => {
    const checkbox = e.target as HTMLInputElement;
    console.log('🔘 Checkbox changed:', checkbox.checked);
    this.toggleAutoSync(checkbox.checked);
  };

  private handleButtonClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation(); // 🔧 Prevent event bubbling

    console.log('🖱️ Button clicked, current state:', this.isEnabled);
    this.toggleAutoSync(!this.isEnabled);

    // Update checkbox to match
    const checkbox = document.getElementById(
      'auto-sync-checkbox'
    ) as HTMLInputElement;
    if (checkbox) checkbox.checked = this.isEnabled;
  };

  private setupControls() {
    const checkbox = document.getElementById(
      'auto-sync-checkbox'
    ) as HTMLInputElement;
    const button = document.getElementById('auto-sync-button') as HTMLElement;

    // 🔧 Remove any existing listeners first
    if (checkbox) {
      checkbox.removeEventListener('change', this.handleCheckboxChange);
      checkbox.addEventListener('change', this.handleCheckboxChange);
    }

    if (button) {
      button.removeEventListener('click', this.handleButtonClick);
      button.addEventListener('click', this.handleButtonClick);
    }
  }

  private loadSettings() {
    const saved = localStorage.getItem('autoSync');
    this.isEnabled = saved === 'true';

    const checkbox = document.getElementById(
      'auto-sync-checkbox'
    ) as HTMLInputElement;
    if (checkbox) checkbox.checked = this.isEnabled;

    this.updateButtonState();
  }

  private toggleAutoSync(enabled: boolean) {
    this.isEnabled = enabled;
    localStorage.setItem('autoSync', enabled.toString());

    if (enabled) {
      console.log('🟢 AUTO-SYNC ENABLED');
      this.start();
    } else {
      console.log('🔴 AUTO-SYNC DISABLED');
      this.stop();
    }
    this.updateButtonState();
  }

  setTimezone(timezone: string) {
    this.selectedTimezone = timezone;
  }

  private start() {
    this.stop();

    const resolution = this.getCurrentResolution();
    const config =
      APP_CONFIG.RESOLUTION_CONFIG[
        resolution as keyof typeof APP_CONFIG.RESOLUTION_CONFIG
      ];

    if (!config) return;

    this.updateDates();

    this.autoSyncInterval = window.setInterval(() => {
      this.updateDates();

      if (resolution === '1min') {
        const tickCount = Math.floor(Date.now() / config.updateInterval) % 4;
        if (tickCount === 0) {
          void this.onUpdate();
        }
      }
    }, config.updateInterval);

    debugLog(`🕐 Auto-sync started with ${config.updateInterval}ms interval`);
  }

  private stop() {
    if (this.autoSyncInterval !== null) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      debugLog('🛑 Auto-sync stopped');
    }
  }

  private updateDates() {
    console.log('🔄 updateDates called at:', new Date().toLocaleTimeString());

    const resolution = this.getCurrentResolution();
    const now = new Date();
    const start = new Date(now);
    switch (resolution) {
      case '1min':
        start.setHours(start.getHours() - 4);
        break;
      case '5min':
        start.setHours(start.getHours() - 12);
        break;
      case '15min':
        start.setDate(start.getDate() - 1);
        break;
      case '60min':
        start.setDate(start.getDate() - 3);
        break;
      case '1d':
      default:
        start.setMonth(start.getMonth() - 1);
        break;
    }

    const fromInput = document.getElementById('from-date') as HTMLInputElement;
    const toInput = document.getElementById('to-date') as HTMLInputElement;

    if (fromInput && toInput) {
      console.log('📅 Updating dates:', {
        from: fromInput.value,
        to: toInput.value,
        newFrom: Formatters.formatDateForInput(start, this.selectedTimezone),
        newTo: Formatters.formatDateForInput(now, this.selectedTimezone),
      });

      fromInput.value = Formatters.formatDateForInput(
        start,
        this.selectedTimezone
      );
      toInput.value = Formatters.formatDateForInput(now, this.selectedTimezone);

      // 🔧 KEY: These events should trigger chart update
      fromInput.dispatchEvent(new Event('change', { bubbles: true }));
      toInput.dispatchEvent(new Event('change', { bubbles: true }));

      console.log('✅ Date events dispatched');
    } else {
      console.error('❌ Date inputs not found!');
    }
  }

  private getCurrentResolution(): string {
    const select = document.getElementById(
      'resolution-select'
    ) as HTMLSelectElement;
    return select?.value || '1d';
  }

  private updateButtonState() {
    const button = document.getElementById('auto-sync-button') as HTMLElement;
    if (button) {
      // 🔧 FIX: Ensure the active class persists when enabled
      if (this.isEnabled) {
        button.classList.add('active');
        console.log('✅ Auto-sync button set to ACTIVE (should be blue)');
      } else {
        button.classList.remove('active');
        console.log('❌ Auto-sync button set to INACTIVE (should be gray)');
      }
    }
  }
  destroy() {
    this.stop();
  }
}
