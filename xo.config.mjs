import globals from 'globals';

/**
@type {import('xo').FlatXoConfig}
*/
const xoConfig = [
  {
    space: true,
    prettier: 'compat',
    languageOptions: {
      globals: { ...globals.node, ...globals.mocha },
    },
    rules: {
      'unicorn/no-empty-file': 'off',
    },
  },
  {
    files: ['package.json'],
    rules: {
      // The package keeps main and types, and has import-time side effects (its default repository): an exports field or a
      // sideEffects one would change how it resolves for its users.
      'package-json/prefer-exports': 'off',
      'package-json/prefer-side-effects-field': 'off',
      // The prettier-plugin-packagejson plugin formats package.json, the repository and bugs objects included.
      'package-json/sort-properties': 'off',
      'package-json/prefer-shorthand': 'off',
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
