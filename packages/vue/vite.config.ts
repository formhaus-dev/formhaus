import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      rollupTypes: true,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        cloud: resolve(__dirname, 'src/cloud/index.ts'),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: ['vue', '@formhaus/core', '@formhaus/core/cloud', '@formhaus/vue'],
    },
  },
});
