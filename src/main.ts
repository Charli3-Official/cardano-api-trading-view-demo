import { TradingViewDemoApp } from './app.js';

let app: TradingViewDemoApp;

async function initialize() {
  app = new TradingViewDemoApp();
  await app.initialize();

  // Expose API for external integration
  (window as any).TradingViewDemo = app.getAPI();
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  app?.destroy();
});

// Export for manual initialization
export { TradingViewDemoApp, initialize };
