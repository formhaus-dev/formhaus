import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: { entry: 'src/index.ts' },
  clean: true,
  treeshake: true,
  sourcemap: true,
  target: 'node20',
  platform: 'node',
  external: ['@formhaus/core', '@modelcontextprotocol/sdk', 'zod', 'ajv'],
});
