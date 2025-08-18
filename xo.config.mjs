import globals from 'globals';

/** @type {import('xo').FlatXoConfig} */
const xoConfig = [
  {
    space: true,
    prettier: true,
    languageOptions: {
      globals: { ...globals.node, ...globals.mocha },
    },
    rules: {
      'unicorn/no-empty-file': 'off',
    },
  },
  {
    files: ['test/*', 'vitest.config.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
];

export default xoConfig;
