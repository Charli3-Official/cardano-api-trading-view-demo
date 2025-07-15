import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  console.log('VITE_API_URL:', env.VITE_API_URL);
  console.log(
    'Available env keys:',
    Object.keys(env).filter(key => key.startsWith('VITE_'))
  );

  // Set base path for GitHub Pages deployment
  const isProduction = mode === 'production';
  const base = isProduction ? '/cardano-api-trading-view-demo/' : '/';

  return {
    base,
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
        },
      },
    },
  };
});
