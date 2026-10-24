import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

const INTERNAL_PROPS =
  /^(validationEpoch|operationEpoch|latestOperation|sending|lifecycle|subscriptions|visibility|reconcileHidden|markChanged|allFields|conditionValues|activeField|activeItem|itemFields|getCanGoNext|findStepIndex|affectsStructure|serverErrors|serverFormErrors|skipped|seedItems|resetStarts|reseed|startValue|itemStartValue|view|keyList|scopes|notify|advance|seedStarts|remember|rememberItem|dropItem|watchWrites|loadPayload|fieldsByKey|fieldDependents|routeFields|stepDependents|stepOfField|sectionOf|unsettle|reconcile|settle|onPath|conditionSources|invalidate|viewedStep|shownFields|conditionResults|structureChanged|valuesChanged|fieldKeys|fieldOf|suggest|withKept|keep)$/;

const shared = {
  define: { __FORMHAUS_CORE_VERSION__: JSON.stringify(version) },
  esbuildOptions(options: { mangleProps?: RegExp }) {
    options.mangleProps = INTERNAL_PROPS;
  },
  treeshake: true,
  minify: false,
  sourcemap: true,
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      cloud: 'src/cloud/index.ts',
      server: 'src/server/index.ts',
      internal: 'src/internal/index.ts',
      i18n: 'src/i18n/index.ts',
      fix: 'src/fix/index.ts',
      research: 'src/research/index.ts',
      fields: 'src/fields/index.ts',
      controls: 'src/controls/index.ts',
      schema: 'src/schema/index.ts',
    },
    format: ['esm'],
    external: ['@formhaus/core/fields'],
    dts: true,
    clean: true,
    splitting: true,
    target: 'es2020',
  },
  {
    ...shared,
    entry: { server: 'src/server/index.ts' },
    format: ['iife'],
    minify: true,
    globalName: 'Formhaus',
    target: 'es2017',
    outExtension: () => ({ js: '.iife.js' }),
    banner: { js: 'typeof console==="undefined"&&(globalThis.console={log:function(){},warn:function(){},error:function(){}});' },
  },
]);
