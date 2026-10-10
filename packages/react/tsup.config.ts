import { readFile, writeFile } from 'node:fs/promises';
import { defineConfig } from 'tsup';

const shared = {
  format: ['esm' as const],
  dts: true,
  treeshake: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    external: ['react', 'react-dom', '@formhaus/core'],
  },
  {
    ...shared,
    entry: { cloud: 'src/cloud/index.ts' },
    async onSuccess() {
      const file = 'dist/cloud.js';
      await writeFile(file, `'use client';${await readFile(file, 'utf8')}`);
    },
    external: ['react', 'react-dom', '@formhaus/core', '@formhaus/core/cloud', '@formhaus/react'],
  },
]);
