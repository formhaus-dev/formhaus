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

async function useClient(file: string): Promise<void> {
  await writeFile(file, `'use client';${await readFile(file, 'utf8')}`);
}

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    onSuccess: () => useClient('dist/index.js'),
    external: ['react', 'react-dom', '@formhaus/core', '@formhaus/core/internal'],
  },
  {
    ...shared,
    entry: { cloud: 'src/cloud/index.ts' },
    onSuccess: () => useClient('dist/cloud.js'),
    external: ['react', 'react-dom', '@formhaus/core', '@formhaus/core/cloud', '@formhaus/core/internal', '@formhaus/react'],
  },
]);
