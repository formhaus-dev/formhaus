import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    { name: 'markdown-text', transform: (code, id) => (id.endsWith('.md') ? `export default ${JSON.stringify(code)};` : undefined) },
  ],
  test: {
    environment: 'node',
    globalSetup: ['./__tests__/global-setup.ts'],
    testTimeout: 20000,
  },
});
