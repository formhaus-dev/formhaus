import { readFile, writeFile } from 'node:fs/promises';
import { defineConfig } from 'tsup';

const INTERNAL_PROPS = /^(invalidAttempts|onItemsChange|actionError|changeItems|ProgressComponent|ActionsComponent|inputId)$/;

const shared = {
  esbuildOptions(options: { mangleProps?: RegExp; sourcesContent?: boolean }) {
    options.mangleProps = INTERNAL_PROPS;
    options.sourcesContent = false;
  },
  format: ['esm' as const],
  dts: true,
  treeshake: true,
  minify: false,
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
    external: ['react', 'react-dom', '@formhaus/core', '@formhaus/core/internal', '@formhaus/core/fields'],
  },
  {
    ...shared,
    entry: { i18n: 'src/i18n/index.ts' },
    onSuccess: () => useClient('dist/i18n.js'),
    external: ['react', '@formhaus/core', '@formhaus/core/i18n'],
  },
  {
    ...shared,
    entry: { controls: 'src/controls/index.ts' },
    onSuccess: () => useClient('dist/controls.js'),
    external: ['react', '@formhaus/core/controls', '@formhaus/react'],
  },
  {
    ...shared,
    entry: { cloud: 'src/cloud/index.ts' },
    onSuccess: () => useClient('dist/cloud.js'),
    external: [
      'react',
      'react-dom',
      '@formhaus/core',
      '@formhaus/core/cloud',
      '@formhaus/core/internal',
      '@formhaus/core/internal/cloud',
      '@formhaus/core/fields',
      '@formhaus/react',
    ],
  },
]);
