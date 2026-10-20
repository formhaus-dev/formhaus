import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./__tests__/global-setup.ts'],
    testTimeout: 20000,
  },
});
