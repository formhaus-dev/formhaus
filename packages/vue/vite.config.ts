import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      bundleTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  oxc: { target: 'es2020' },
  build: {
    target: 'es2020',
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cloud: resolve(__dirname, 'src/cloud/index.ts'),
        i18n: resolve(__dirname, 'src/i18n/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: ['vue', '@formhaus/core', '@formhaus/core/cloud', '@formhaus/core/internal', '@formhaus/core/i18n', '@formhaus/vue'],
    },
  },
});
