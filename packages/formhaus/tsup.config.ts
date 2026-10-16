import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  clean: true,
  treeshake: true,
  target: 'node20',
  platform: 'node',
  loader: { '.md': 'text', '.mdc': 'text' },
});
