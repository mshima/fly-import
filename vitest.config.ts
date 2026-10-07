import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The output of the processes a test runs, without colors: the CI forces them.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    env: { FORCE_COLOR: '0' },
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
