import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { coreDefine, coreSource } from '../core/vitest.source';

export default defineConfig({
  define: coreDefine,
  plugins: [vue()],
  resolve: {
    alias: [{ find: /^@formhaus\/vue$/, replacement: fileURLToPath(new URL('./src/index.ts', import.meta.url)) }, ...coreSource],
    dedupe: ['vue', '@formhaus/core'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./__tests__/setup.ts'],
  },
});
