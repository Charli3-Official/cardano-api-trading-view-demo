import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',

        // Node globals for types
        NodeJS: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
    },
    rules: {
      // Essential rules only - focus on real errors
      ...js.configs.recommended.rules,

      // Security - MUST HAVE for trading app
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Critical errors only
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off', // Let TS handle this
      '@typescript-eslint/no-floating-promises': 'error',
      'no-await-in-loop': 'warn', // Warn, don't error

      // Import organization (helpful but not strict)
      'import/no-duplicates': 'warn',

      // Turn OFF annoying rules
      'no-console': 'off', // Allow console in development
      '@typescript-eslint/no-explicit-any': 'off', // Allow any during development
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      'prefer-arrow/prefer-arrow-functions': 'off',
      'no-magic-numbers': 'off', // Too strict for real development

      // Disable await-in-loop if intentional
      'no-await-in-loop': 'off', // or 'warn' if you want to keep some warning
      // Prettier compatibility
      ...prettierConfig.rules,
    },
  },

  // Ignore files
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      '*.config.js',
      '*.config.ts',
      'vite.config.ts',
      '.husky/**',
      'coverage/**',
    ],
  },
];
