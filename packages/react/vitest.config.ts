import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { coreDefine, coreSource } from '../core/vitest.source';

export default defineConfig({
  define: coreDefine,
  resolve: {
    alias: [{ find: /^@formhaus\/react$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) }, ...coreSource],
    dedupe: ['react', '@formhaus/core'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
  },
});
