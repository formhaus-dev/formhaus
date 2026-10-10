import { defineConfig } from 'tsup';

const shared = {
  treeshake: true,
  minify: true,
  sourcemap: true,
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts', server: 'src/server/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    splitting: false,
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
