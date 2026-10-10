import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@formhaus/react': fileURLToPath(new URL('./src/index.ts', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
