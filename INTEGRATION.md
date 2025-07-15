# Integration Guide

This guide provides comprehensive instructions for integrating the Charli3 TradingView Demo's modular architecture into your application or using it as a foundation for your own trading interface.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Modular Integration](#modular-integration)
- [Component Usage](#component-usage)
- [Framework Integration](#framework-integration)
- [Customization](#customization)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- Node.js 16.0 or higher
- npm 7.0 or higher (or yarn 1.22+)
- Modern web browser with ES2020 support

### Dependencies

```json
{
  "dependencies": {
    "lightweight-charts": "^4.0.0",
    "idb": "^7.0.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

## Architecture Overview

The application follows a modular architecture with clear separation of concerns:

```
├── api/              # Centralized API client and endpoints
├── cache/            # Multi-layer caching with expiration
├── chart/            # Chart management and rendering
├── components/       # Reusable UI components
├── services/         # Business logic and utilities
├── utils/            # Helper functions and formatters
├── types/            # TypeScript type definitions
├── config.ts         # Application configuration
├── app.ts            # Main application controller
└── main.ts           # Entry point
```

### Core Modules

- **API Client** - Handles all external API communication with request queuing
- **Cache Manager** - Intelligent caching system with automatic expiration
- **Chart Manager** - Professional chart rendering with theme support
- **Component System** - Modular UI components for search, metadata, and controls
- **Service Layer** - Business logic for tokens, auto-sync, and streaming

## Installation Methods

### Method 1: Complete Modular Integration (Recommended)

```bash
# Clone the repository
git clone https://github.com/Charli3-Official/cardano-api-trading-view-demo.git
cd cardano-api-trading-view-demo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API credentials

# Start development
npm run dev
```

### Method 2: Component-Based Integration

Copy the modular structure to your existing project:

```
src/
├── api/
│   └── index.ts          # API client
├── cache/
│   └── manager.ts        # Caching system
├── chart/
│   └── manager.ts        # Chart management
├── components/
│   ├── search.ts         # Search component
│   ├── metadata.ts       # Metadata component
│   ├── theme.ts          # Theme component
│   └── controls.ts       # Controls component
├── services/
│   ├── api-queue.ts      # Request queuing
│   ├── token.ts          # Token services
│   └── autosync.ts       # Auto-sync service
├── utils/
│   ├── debug.ts          # Debug utilities
│   ├── formatters.ts     # Formatters
│   └── helpers.ts        # Helper functions
├── types/
│   └── index.ts          # Type definitions
├── config.ts             # Configuration
├── app.ts                # Main app controller
└── main.ts               # Entry point
```

### Method 3: Individual Component Usage

```bash
# Install core dependencies
npm install lightweight-charts idb

# Use individual components as needed
# See component usage examples below
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# Required - Get your token from https://docs.charli3.io
VITE_BEARER_TOKEN=your_charli3_api_token_here
VITE_API_URL=https://api.charli3.io

# Optional
VITE_DEBUG=false
```

### Application Configuration

The `config.ts` file contains all application settings:

```typescript
export const APP_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL,
  BEARER_TOKEN: import.meta.env.VITE_BEARER_TOKEN,
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  DEFAULT_DEX: 'Aggregate',
  DEFAULT_TIMEZONE: 'America/Chicago',
  MAX_SEARCH_RESULTS: 50,
  MAX_CONCURRENT_REQUESTS: 5,
  DEFAULT_CHART_HEIGHT: 500,
  MAX_BARS: 240,
};

export const CACHE_CONFIG = {
  SYMBOLS_EXPIRY: 30 * 60 * 1000, // 30 minutes
  TOKEN_DATA_EXPIRY: 60 * 1000, // 60 seconds
  PRICE_DATA_EXPIRY: 5 * 60 * 1000, // 5 minutes
  LOGO_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
};
```

## Modular Integration

### Complete Application Integration

```typescript
import { TradingViewDemoApp } from './src/app.js';

// Initialize the complete trading interface
const app = new TradingViewDemoApp();
await app.initialize();

// Access the public API
const api = app.getAPI();

// Programmatically select tokens
api.selectToken({
  ticker: 'BTCUSD',
  policy_id: 'your_policy_id',
  asset_name: 'your_asset_name',
  dex: 'Aggregate',
  pair: 'BTC.USD',
});

// Get current application state
const state = api.getState();
const currentToken = api.getCurrentToken();
```

### Individual Service Integration

```typescript
// Use individual services
import { APIClient } from './src/api/index.js';
import { CacheManager } from './src/cache/manager.js';
import { TokenService } from './src/services/token.js';
import { ChartManager } from './src/chart/manager.js';

// Initialize services
const cacheManager = new CacheManager();
const tokenService = new TokenService(cacheManager);
const chartManager = new ChartManager();

// Use services independently
const symbols = await tokenService.getSymbols('Aggregate');
await chartManager.initialize('chart-container');
```

## Component Usage

### Search Component

```typescript
import { SearchComponent } from './src/components/search.js';
import { TokenService } from './src/services/token.js';

const tokenService = new TokenService(cacheManager);
const searchComponent = new SearchComponent(tokenService, token => {
  console.log('Token selected:', token);
});

// Initialize search functionality
searchComponent.initialize();

// Set DEX data for searching
const symbolsData = await tokenService.getSymbols('Aggregate');
searchComponent.setDex('Aggregate', symbolsData);
```

### Chart Component

```typescript
import { ChartManager } from './src/chart/manager.js';

const chartManager = new ChartManager();

// Initialize chart
chartManager.initialize('chart-container');

// Update with historical data
const historicalData = await fetchHistoricalData('BTCUSD', '1d', from, to);
await chartManager.updateChart(historicalData, '1d');

// Update theme
chartManager.updateTheme('dark');
```

### Cache Component

```typescript
import { CacheManager } from './src/cache/manager.js';

const cacheManager = new CacheManager();

// Set data with expiration
await cacheManager.setWithExpiry('symbols', 'Aggregate', data, 30 * 60 * 1000);

// Get cached data
const cachedData = await cacheManager.get('symbols', 'Aggregate');

// Check if expired
const isExpired = await cacheManager.isExpired('symbols', 'Aggregate');

// Clear expired entries
await cacheManager.clearExpired();
```

### Theme Component

```typescript
import { ThemeComponent } from './src/components/theme.js';

const themeComponent = new ThemeComponent(chartManager);
themeComponent.initialize();

// Theme automatically syncs with chart manager
```

### Auto-Sync Component

```typescript
import { AutoSyncService } from './src/services/autosync.js';

const autoSyncService = new AutoSyncService(() => {
  // This function is called when chart needs updating
  return updateChart();
});

autoSyncService.initialize();

// Toggle auto-sync
autoSyncService.toggleAutoSync(true);

// Set timezone
autoSyncService.setTimezone('UTC');
```

## Framework Integration

### React Integration

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { TradingViewDemoApp } from '../lib/trading-app';

interface TradingChartProps {
  apiToken: string;
  theme?: 'dark' | 'light';
  defaultDex?: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  apiToken,
  theme = 'dark',
  defaultDex = 'Aggregate',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<TradingViewDemoApp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentToken, setCurrentToken] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !apiToken) return;

    const initializeApp = async () => {
      try {
        // Set environment configuration
        Object.assign(import.meta.env, {
          VITE_BEARER_TOKEN: apiToken,
          VITE_API_URL: 'https://api.charli3.io',
          VITE_DEBUG: false,
        });

        // Set theme
        document.documentElement.setAttribute('data-theme', theme);

        // Initialize the trading app
        appRef.current = new TradingViewDemoApp();
        await appRef.current.initialize();

        // Set default DEX
        const api = appRef.current.getAPI();
        api.selectDex(defaultDex);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize trading app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      appRef.current?.destroy();
    };
  }, [apiToken, theme, defaultDex]);

  const handleTokenSelect = (tokenData: any) => {
    if (appRef.current) {
      const api = appRef.current.getAPI();
      api.selectToken(tokenData);
      setCurrentToken(tokenData);
    }
  };

  if (isLoading) {
    return <div className='loading'>Initializing trading interface...</div>;
  }

  return (
    <div className='trading-chart-wrapper'>
      {/* Include the complete HTML structure from index.html */}
      <div ref={containerRef} className='trading-demo-container'>
        <header className='header'>
          <div className='container'>
            <div className='header-content'>
              <div className='header-logo-section'>
                <img
                  src='/assets/charli3_black_icon.png'
                  alt='Charli3'
                  className='header-logo'
                />
                <div className='header-text'>
                  <h1 className='header-title'>Charli3</h1>
                  <p className='header-subtitle'>Cardano API</p>
                </div>
              </div>
              <div className='header-middle'>
                <h2 className='main-title'>Trading Interface</h2>
              </div>
              <div className='theme-toggle'>
                <span className='theme-toggle-label'>Dark</span>
                <div id='theme-switch' className='theme-switch'></div>
                <span className='theme-toggle-label'>Light</span>
              </div>
            </div>
          </div>
        </header>

        <div className='container'>
          {/* DEX Selection */}
          <div className='dex-selection'>
            <div id='dex-list' className='dex-list'></div>
          </div>

          {/* Search Section */}
          <div className='search-section'>
            <div className='search-container'>
              <input
                type='text'
                id='search-input'
                className='search-input'
                placeholder='Search by token, e.g., ADA.C3'
                autocomplete='off'
              />
              <div id='search-results' className='search-results'></div>
            </div>
          </div>

          {/* Token Info Panel */}
          <div id='token-info-panel' className='token-info-panel hidden'>
            {/* Token info content from index.html */}
          </div>

          {/* Stream Widget */}
          <div id='stream-widget' className='stream-widget hidden'>
            {/* Stream widget content from index.html */}
          </div>

          {/* Time Controls */}
          <div className='time-controls'>
            {/* Time controls from index.html */}
          </div>

          {/* Chart Container */}
          <div className='chart-container'>
            <div id='chart'></div>
          </div>
        </div>
      </div>

      {/* React-specific controls */}
      <div className='react-controls'>
        <button
          onClick={() =>
            handleTokenSelect({ ticker: 'BTCUSD', dex: 'Aggregate' })
          }
        >
          Load BTC/USD
        </button>
        {currentToken && (
          <div className='current-token'>
            Selected: {currentToken.ticker} ({currentToken.dex})
          </div>
        )}
      </div>
    </div>
  );
};
```

### Vue Integration

```vue
<template>
  <div ref="appContainer" class="trading-app">
    <div v-if="isLoading" class="loading">
      Initializing trading interface...
    </div>
    <div v-else class="trading-interface">
      <!-- Include the complete HTML structure from index.html -->
      <header class="header">
        <div class="container">
          <div class="header-content">
            <!-- Header content -->
          </div>
        </div>
      </header>

      <div class="container">
        <!-- Complete trading interface structure -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { TradingViewDemoApp } from '../lib/trading-app';

interface Props {
  apiToken: string;
  theme?: 'dark' | 'light';
  defaultDex?: string;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'dark',
  defaultDex: 'Aggregate',
});

const appContainer = ref<HTMLDivElement>();
const isLoading = ref(true);
const currentToken = ref(null);
let tradingApp: TradingViewDemoApp | null = null;

onMounted(async () => {
  if (!appContainer.value || !props.apiToken) return;

  try {
    // Set environment configuration
    Object.assign(import.meta.env, {
      VITE_BEARER_TOKEN: props.apiToken,
      VITE_API_URL: 'https://api.charli3.io',
      VITE_DEBUG: false,
    });

    // Set theme
    document.documentElement.setAttribute('data-theme', props.theme);

    // Initialize the trading app
    tradingApp = new TradingViewDemoApp();
    await tradingApp.initialize();

    // Set default DEX
    const api = tradingApp.getAPI();
    api.selectDex(props.defaultDex);

    isLoading.value = false;
  } catch (error) {
    console.error('Failed to initialize trading app:', error);
    isLoading.value = false;
  }
});

onUnmounted(() => {
  tradingApp?.destroy();
});

const selectToken = (tokenData: any) => {
  if (tradingApp) {
    const api = tradingApp.getAPI();
    api.selectToken(tokenData);
    currentToken.value = tokenData;
  }
};
</script>

<style>
/* Include styles from style.css */
@import '../assets/style.css';
</style>
```

### Next.js Integration

```tsx
// pages/trading.tsx
import dynamic from 'next/dynamic';
import Head from 'next/head';

const TradingInterface = dynamic(
  () => import('../components/TradingInterface'),
  {
    ssr: false,
    loading: () => <div>Loading trading interface...</div>,
  }
);

export default function TradingPage() {
  return (
    <>
      <Head>
        <title>Cardano DEX Trading - Charli3</title>
        <meta
          name='description'
          content='Professional modular trading interface for Cardano DeFi'
        />
        <link rel='icon' href='/assets/charli3_black_icon.png' />
      </Head>
      <TradingInterface
        apiToken={process.env.NEXT_PUBLIC_CHARLI3_TOKEN!}
        theme='dark'
        defaultDex='Aggregate'
      />
    </>
  );
}

// components/TradingInterface.tsx
import { useEffect, useRef, useState } from 'react';
import { TradingViewDemoApp } from '../lib/trading-app';

interface Props {
  apiToken: string;
  theme?: 'dark' | 'light';
  defaultDex?: string;
}

export default function TradingInterface({
  apiToken,
  theme = 'dark',
  defaultDex = 'Aggregate',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [app, setApp] = useState<TradingViewDemoApp | null>(null);

  useEffect(() => {
    if (!containerRef.current || !apiToken) return;

    // Dynamic import to avoid SSR issues
    const initializeApp = async () => {
      try {
        const { TradingViewDemoApp } = await import('../lib/trading-app');

        // Set configuration
        Object.assign(globalThis, {
          CHARLI3_CONFIG: {
            VITE_BEARER_TOKEN: apiToken,
            VITE_API_URL: 'https://api.charli3.io',
            VITE_DEBUG: false,
          },
        });

        // Set theme
        document.documentElement.setAttribute('data-theme', theme);

        // Initialize app
        const tradingApp = new TradingViewDemoApp();
        await tradingApp.initialize();

        setApp(tradingApp);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize trading app:', error);
      }
    };

    initializeApp();

    return () => {
      app?.destroy();
    };
  }, [apiToken, theme]);

  if (!isInitialized) {
    return (
      <div className='loading-container'>
        <div className='loading-spinner'></div>
        <p>Initializing trading interface...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className='trading-interface'>
      {/* Include complete HTML structure from index.html */}
      <div
        dangerouslySetInnerHTML={{
          __html: `
          <!-- Complete trading interface HTML structure -->
        `,
        }}
      />
    </div>
  );
}
```

## Customization

### Theme Customization

The modular theme system uses CSS custom properties:

```css
:root[data-theme='custom'] {
  /* Background colors */
  --bg-primary: #0f0f0f;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #2a2a2a;

  /* Text colors */
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --text-tertiary: #999999;

  /* Border and accent colors */
  --border-color: #333333;
  --accent-blue: #3b82f6;
  --accent-green: #10b981;
  --accent-red: #ef4444;

  /* Chart specific colors */
  --chart-bg: #161b22;
  --chart-grid: #30363d;
  --chart-text: #c9d1d9;
}
```

### Component Customization

```typescript
// Customize chart configuration
import { ChartManager } from './src/chart/manager.js';

const chartManager = new ChartManager();

// Override chart options
chartManager.initialize('chart-container', {
  height: 600,
  layout: {
    background: { color: '#custom-bg-color' },
    textColor: '#custom-text-color',
  },
  // Add your custom options
});
```

### Cache Configuration

```typescript
// Customize cache settings
import { CACHE_CONFIG } from './src/config.js';

// Override cache durations
Object.assign(CACHE_CONFIG, {
  SYMBOLS_EXPIRY: 60 * 60 * 1000, // 1 hour
  TOKEN_DATA_EXPIRY: 30 * 1000, // 30 seconds
  PRICE_DATA_EXPIRY: 2 * 60 * 1000, // 2 minutes
});
```

## Deployment

### Production Build

```bash
# Build the modular application
npm run build

# The dist/ folder contains all optimized files
# Deploy this folder to any static hosting service
```

### Environment Variables for Production

```env
# Production .env
VITE_BEARER_TOKEN=your_production_token
VITE_API_URL=https://api.charli3.io
VITE_DEBUG=false
```

### Docker Deployment

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Troubleshooting

### Common Issues

#### Module Import Errors

```bash
# Ensure proper file extensions in imports
# Use .js extensions for TypeScript imports
import { TokenService } from './services/token.js';  // ✅ Correct
import { TokenService } from './services/token';     // ❌ Incorrect
```

#### Cache Issues

```typescript
// Clear cache programmatically
import { CacheManager } from './src/cache/manager.js';

const cacheManager = new CacheManager();

// Clear all cache
await cacheManager.clearAll();

// Clear only expired entries
await cacheManager.clearExpired();

// Check cache status
const info = await cacheManager.getInfo();
console.table(info.symbols);
```

#### Component Initialization Errors

```typescript
// Ensure proper initialization order
const cacheManager = new CacheManager();
const tokenService = new TokenService(cacheManager);
const chartManager = new ChartManager();

// Initialize in correct order
await cacheManager.clearExpired();
chartManager.initialize('chart-container');
// Then initialize other components
```

#### TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

### Performance Optimization

```typescript
// Optimize bundle with Vite
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'trading-core': ['./src/app.ts', './src/main.ts'],
          'chart-engine': ['lightweight-charts'],
          'data-layer': ['./src/api/index.ts', './src/cache/manager.ts'],
          components: [
            './src/components/search.ts',
            './src/components/metadata.ts',
          ],
          services: ['./src/services/token.ts', './src/services/autosync.ts'],
          utilities: ['./src/utils/formatters.ts', './src/utils/helpers.ts'],
        },
      },
    },
  },
});
```

### Debug Tools

```typescript
// Enable comprehensive debugging
localStorage.setItem('charli3-debug', 'true');

// Access debug tools in browser console
window.TradingViewDemo.getState();
window.CacheManager.getInfo();
window.clearCache();

// Component-specific debugging
const app = new TradingViewDemoApp();
app.getAPI().getCurrentToken();
```

### Support Resources

- **API Documentation**: [https://docs.charli3.io](https://docs.charli3.io)
- **GitHub Repository**: [https://github.com/Charli3-Official/cardano-api-trading-view-demo](https://github.com/Charli3-Official/cardano-api-trading-view-demo)
- **Discord Community**: [https://discord.com/invite/Tnsc3HCA3A](https://discord.com/invite/Tnsc3HCA3A)
- **Technical Support**: [support@charli3.io](mailto:support@charli3.io)

### Version Compatibility

| Demo Version | Architecture | Lightweight Charts | Node.js | TypeScript | Browser Support |
| ------------ | ------------ | ------------------ | ------- | ---------- | --------------- |
| 1.0.x        | Modular      | ^4.0.0             | 16+     | ^5.0.0     | ES2020+         |

This integration guide reflects the current modular architecture implementation. The component-based design allows for flexible integration patterns and easy customization for specific use cases.
