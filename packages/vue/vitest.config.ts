import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@formhaus/vue': fileURLToPath(new URL('./src/index.ts', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
