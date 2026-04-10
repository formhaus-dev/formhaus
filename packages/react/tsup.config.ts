import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  minify: true,
  target: 'es2020',
  external: ['react', 'react-dom', '@formhaus/core'],
});
