import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      include: ['src/fly-import.ts'],
      provider: 'v8',
      thresholds: {
        lines: 100,
        branches: 95,
        statements: 100,
      },
    },
  },
});
