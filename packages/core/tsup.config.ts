import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

const shared = {
  define: { __FORMHAUS_CORE_VERSION__: JSON.stringify(version) },
  treeshake: true,
  minify: true,
  sourcemap: true,
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts', cloud: 'src/cloud/index.ts', server: 'src/server/index.ts', internal: 'src/internal/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: true,
    target: 'es2020',
  },
  {
    ...shared,
    entry: { server: 'src/server/index.ts' },
    format: ['iife'],
    globalName: 'Formhaus',
    target: 'es2017',
    outExtension: () => ({ js: '.iife.js' }),
    banner: { js: 'typeof console==="undefined"&&(globalThis.console={log:function(){},warn:function(){},error:function(){}});' },
  },
]);
