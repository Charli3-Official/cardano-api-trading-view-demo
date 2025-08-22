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
    // Default to false (disabled) if no saved setting exists
    this.isEnabled = saved === 'true';

    console.log('🔧 Auto-sync settings loaded:', {
      savedValue: saved,
      isEnabled: this.isEnabled,
    });

    const checkbox = document.getElementById(
      'auto-sync-checkbox'
    ) as HTMLInputElement;
    if (checkbox) checkbox.checked = this.isEnabled;

    this.updateButtonState();

    // Ensure auto-sync actually starts if it's supposed to be enabled
    if (this.isEnabled) {
      console.log('🟢 Auto-sync was saved as enabled, starting it now');
      this.start();
    } else {
      console.log('🔴 Auto-sync starting as disabled (default)');
    }
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

    // Don't call updateDates() immediately - preserve user's current date range

    this.autoSyncInterval = window.setInterval(() => {
      this.updateDates();

      // Always update the chart when dates change, regardless of resolution
      console.log(
        '🔄 Auto-sync triggering chart update for resolution:',
        resolution
      );
      void this.onUpdate();
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

    const now = new Date();
    const fromInput = document.getElementById('from-date') as HTMLInputElement;
    const toInput = document.getElementById('to-date') as HTMLInputElement;

    if (fromInput && toInput) {
      // Calculate the current time window duration
      const oldFromDate = new Date(fromInput.value);
      const oldToDate = new Date(toInput.value);
      const windowDuration = oldToDate.getTime() - oldFromDate.getTime(); // in milliseconds

      // Create new sliding window: keep the same duration but end at current time
      const newToDate = now;
      const newFromDate = new Date(now.getTime() - windowDuration);

      const newFromValue = Formatters.formatDateForInput(
        newFromDate,
        this.selectedTimezone
      );
      const newToValue = Formatters.formatDateForInput(
        newToDate,
        this.selectedTimezone
      );

      console.log('📅 Sliding time window:', {
        windowDuration: `${Math.round(windowDuration / (1000 * 60))} minutes`,
        oldWindow: `${fromInput.value} to ${toInput.value}`,
        newWindow: `${newFromValue} to ${newToValue}`,
        currentTime: now.toLocaleString(),
      });

      // Update both dates to create sliding window
      fromInput.value = newFromValue;
      toInput.value = newToValue;

      // Dispatch change events for both inputs
      fromInput.dispatchEvent(new Event('change', { bubbles: true }));
      toInput.dispatchEvent(new Event('change', { bubbles: true }));

      console.log(
        '✅ Sliding window updated - showing latest data with same duration'
      );
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
