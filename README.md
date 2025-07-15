# Charli3 TradingView Demo

<div align="center">

![Charli3 Logo](https://raw.githubusercontent.com/Charli3-Official/cardano-api-trading-view-demo/main/assets/charli3_black_icon.png)

**Professional Trading Charts for Cardano DeFi Markets**

[![CI/CD Pipeline](https://github.com/Charli3-Official/cardano-api-trading-view-demo/workflows/Build%20and%20Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/Charli3-Official/cardano-api-trading-view-demo/actions)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg)](https://vitejs.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[![GitHub stars](https://img.shields.io/github/stars/Charli3-Official/cardano-api-trading-view-demo?style=social)](https://github.com/Charli3-Official/cardano-api-trading-view-demo/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Charli3-Official/cardano-api-trading-view-demo?style=social)](https://github.com/Charli3-Official/cardano-api-trading-view-demo/network/members)
[![GitHub issues](https://img.shields.io/github/issues/Charli3-Official/cardano-api-trading-view-demo)](https://github.com/Charli3-Official/cardano-api-trading-view-demo/issues)

[Live Demo](https://charli3-official.github.io/cardano-api-trading-view-demo/) • [Documentation](https://docs.charli3.io/cardano-price-api) • [Get API Key](https://api.charli3.io/sign-up) • [Discord](https://discord.com/invite/Tnsc3HCA3A)

</div>

---

## Overview

Professional modular trading chart interface for Cardano DeFi markets powered by Charli3 Oracle data. Built with a clean, component-based architecture for easy integration and customization.

### Key Features

- **Modular Architecture** - Component-based design for easy integration and customization
- **Professional Charts** - TradingView-style candlestick charts with volume indicators
- **Real-time Streaming** - Live price updates for Aggregate DEX pairs with auto-sync functionality
- **Multi-DEX Support** - Data from all major Cardano DEXes with intelligent caching
- **Smart Search** - Token search with TVL-based ranking and clean pair display
- **Intelligent Caching** - Multi-layer caching system with automatic expiration management
- **Auto-Sync** - Dynamic time range management based on resolution with visual indicators
- **Professional UI** - Clean header with branding, theme toggle, and responsive design
- **Timezone Support** - Auto-detected timezone with manual override capabilities
- **Type-Safe** - Built with TypeScript for robust development and easy maintenance

---

## Try the Live Demo

**[Launch Demo](https://charli3-official.github.io/cardano-api-trading-view-demo/)**

To use the demo, you'll need a free API key:

1. [Sign up for API access](https://api.charli3.io/sign-up) (free tier: 100 calls)
2. Click "API Configuration Required" in the demo
3. Add your Base URL: `https://api.charli3.io`
4. Add your Bearer Token from your dashboard
5. Start exploring Cardano DeFi markets

New to the API? Check out the [developer documentation](https://docs.charli3.io/cardano-price-api) for complete guides and examples.

---

## Quick Start

### Prerequisites

- **Node.js** 16.0+ (recommended: 18.0+)
- **npm** 7.0+ or **yarn** 1.22+
- **Charli3 API Token** ([Sign up here](https://api.charli3.io/sign-up))

### Installation

```bash
# Clone the repository
git clone https://github.com/Charli3-Official/cardano-api-trading-view-demo.git
cd cardano-api-trading-view-demo

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Charli3 API token to .env

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env` file in the project root:

```env
# Charli3 API Configuration
VITE_BEARER_TOKEN=your_charli3_api_token_here
VITE_API_URL=https://api.charli3.io

# Development Settings
VITE_DEBUG=false
```

### Getting Your API Key

This demo requires your own API key - no pre-configured keys are provided.

1. Sign up: Visit [api.charli3.io/sign-up](https://api.charli3.io/sign-up) to create your account
2. Get API key: Generate your bearer token from the dashboard
3. Read docs: Check [docs.charli3.io/cardano-price-api](https://docs.charli3.io/cardano-price-api) for complete API documentation
4. Configure: Add your token to the in-app configuration panel or environment file

Free tier includes: 100 API calls to try the demo and explore functionality.

---

## Project Structure

```
cardano-api-trading-view-demo/
├── public/
│   └── assets/             # Static assets and logos
├── src/
│   ├── api/
│   │   └── index.ts        # API client and endpoints
│   ├── cache/
│   │   └── manager.ts      # Intelligent caching system
│   ├── chart/
│   │   └── manager.ts      # Chart creation and management
│   ├── components/
│   │   ├── search.ts       # Token search functionality
│   │   ├── metadata.ts     # Token metadata display
│   │   ├── theme.ts        # Theme management
│   │   └── controls.ts     # Time controls and resolution
│   ├── services/
│   │   ├── api-queue.ts    # Request queuing system
│   │   ├── token.ts        # Token-related services
│   │   └── autosync.ts     # Auto-sync functionality
│   ├── utils/
│   │   ├── debug.ts        # Debug logging utilities
│   │   ├── formatters.ts   # Number and date formatting
│   │   └── helpers.ts      # General utility functions
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   ├── config.ts           # Application configuration
│   ├── app.ts              # Main application controller
│   ├── main.ts             # Application entry point
│   ├── stream.ts           # WebSocket streaming functionality
│   └── style.css           # Application styles
├── index.html              # Main HTML file with complete UI structure
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
└── README.md               # This file
```

---

## Available Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start development server |
| `npm run build`      | Build for production     |
| `npm run preview`    | Preview production build |
| `npm run lint`       | Check code quality       |
| `npm run format`     | Format code              |
| `npm run type-check` | TypeScript validation    |
| `npm run quality`    | Run all quality checks   |

---

## Supported DEX Platforms

<div align="center">

| DEX        | Status | Features                            |
| ---------- | ------ | ----------------------------------- |
| Aggregate  | Active | Synthetic pool, Real-time streaming |
| Minswap    | Active | V1 and V2 protocols                 |
| SundaeSwap | Active | V1 and V3 protocols                 |
| WingRiders | Active | V1 and V2 protocols                 |
| MuesliSwap | Active | Community DEX                       |
| Spectrum   | Active | AMM protocol                        |
| Splash     | Active | DEX platform                        |
| VyFi       | Active | Yield farming platform              |

</div>

Note: Aggregate is a synthetic pool combining data from all other DEXes and supports real-time streaming with intelligent auto-sync.

---

## Advanced Features

### Modular Architecture

The application is built with a clean, component-based architecture:

- **API Layer** - Centralized API client with request queuing
- **Cache Layer** - Multi-level caching with automatic expiration
- **Chart Management** - Dedicated chart controller with theme support
- **Component System** - Reusable UI components for search, metadata, and controls
- **Service Layer** - Business logic separation for tokens, auto-sync, and streaming

### Intelligent Caching System

Multi-layer caching strategy for optimal performance:

| Cache Type   | Duration   | Storage   | Purpose                |
| ------------ | ---------- | --------- | ---------------------- |
| Symbols Data | 30 minutes | IndexedDB | DEX symbol information |
| Token Data   | 60 seconds | Memory    | Current prices and TVL |
| Price Data   | 5 minutes  | Memory    | Historical price data  |
| Token Logos  | 24 hours   | Memory    | Token logo images      |

### Auto-Sync with Visual Indicators

Intelligent time range management with visual feedback:

| Resolution | Time Range    | Update Interval |
| ---------- | ------------- | --------------- |
| 1min       | Last 4 hours  | 15 seconds      |
| 5min       | Last 12 hours | 30 seconds      |
| 15min      | Last 1 day    | 1 minute        |
| 60min      | Last 3 days   | 5 minutes       |
| 1d         | Last 1 month  | 30 minutes      |

### Smart Resolution Management

- Dynamic resolution validation based on 240 bar limit
- Automatic suggestions for optimal resolutions
- Visual indicators for locked resolutions with explanations
- Intelligent resolution switching based on time range

### Real-time Streaming

Live updates for Aggregate DEX pairs with comprehensive data:

- Current and previous prices with change indicators
- TVL (Total Value Locked) tracking and changes
- Trading volume monitoring
- Block timestamps and metadata
- Connection status with automatic reconnection

---

## Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 90+     |
| Firefox | 88+     |
| Safari  | 14+     |
| Edge    | 90+     |

---

## Integration & Development

### Integration

For detailed integration instructions, component usage, and framework-specific examples, see [INTEGRATION.md](INTEGRATION.md).

Quick integration example:

```typescript
import { TradingViewDemoApp } from './src/app.js';

// Initialize the complete trading interface
const demo = new TradingViewDemoApp();
await demo.initialize();

// Access the public API
const api = demo.getAPI();
api.selectToken({
  ticker: 'BTCUSD',
  policy_id: 'your_policy_id',
  dex: 'Aggregate',
});
```

### Development

Architecture Benefits:

- Modular components for easy testing and maintenance
- TypeScript for type safety and better development experience
- Intelligent caching reduces API calls and improves performance
- Clean separation of concerns for business logic and UI

Debugging:
Enable comprehensive debug logging:

```env
VITE_DEBUG=true
```

---

## Documentation & Resources

- API Documentation: [docs.charli3.io](https://docs.charli3.io)
- Integration Guide: [INTEGRATION.md](INTEGRATION.md)
- Live Demo: [Try it now](https://charli3-official.github.io/cardano-api-trading-view-demo/)
- Source Code: [GitHub Repository](https://github.com/Charli3-Official/cardano-api-trading-view-demo)

---

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the modular architecture
4. Run quality checks (`npm run quality`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Found a Bug?

- Check existing [issues](https://github.com/Charli3-Official/cardano-api-trading-view-demo/issues)
- Create a [new issue](https://github.com/Charli3-Official/cardano-api-trading-view-demo/issues/new) with detailed description

---

## Community & Support

<div align="center">

[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-7289da?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/invite/Tnsc3HCA3A)
[![X](https://img.shields.io/badge/X-Follow-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/Oraclecharli3)
[![GitHub](https://img.shields.io/badge/GitHub-Star-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Charli3-Official/cardano-api-trading-view-demo)

</div>

---

## License

This project is licensed under the GNU License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with care by the [Charli3 Team](https://charli3.io)

Star us on GitHub if this project helped you!

</div>
