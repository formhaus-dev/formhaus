import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

const INTERNAL_PROPS =
  /^(validationEpoch|operationEpoch|latestOperation|sending|lifecycle|subscriptions|visibility|reconcileHidden|markChanged|allFields|conditionValues|activeField|activeItem|itemFields|getCanGoNext|findStepIndex|affectsStructure|serverErrors|serverFormErrors|skipped|seedItems|resetStarts|reseed|startValue|itemStartValue|view|keyList|scopes|notify|advance|seedStarts|remember|rememberItem|dropItem|watchWrites|loadPayload|fieldsByKey|fieldDependents|routeFields|stepDependents|stepOfField|sectionOf|unsettle|reconcile|settle|onPath|conditionSources|invalidate|viewedStep|shownFields|conditionResults|structureChanged|valuesChanged|fieldKeys|fieldOf|suggest|withKept|keep)$/;

const shared = {
  define: { __FORMHAUS_CORE_VERSION__: JSON.stringify(version) },
  esbuildOptions(options: { mangleProps?: RegExp; sourcesContent?: boolean }) {
    options.mangleProps = INTERNAL_PROPS;
    options.sourcesContent = false;
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
      'internal/cloud': 'src/internal/cloud.ts',
      i18n: 'src/i18n/index.ts',
      fix: 'src/fix/index.ts',
      research: 'src/research/index.ts',
      fields: 'src/fields/index.ts',
      controls: 'src/controls/index.ts',
      schema: 'src/schema/index.ts',
      dirty: 'src/dirty/index.ts',
      html: 'src/html/index.ts',
    },
    format: ['esm'],
    external: ['@formhaus/core/fields'],
    dts: true,
    clean: true,
    splitting: true,
    target: 'es2020',
  },
  ...[
    { entry: { server: 'src/server/index.ts' }, globalName: 'Formhaus', target: 'es2017' },
    { entry: { html: 'src/html/index.ts' }, globalName: 'FormhausHtml', target: 'es2020' },
  ].map((bundle) => ({
    ...shared,
    ...bundle,
    format: ['iife' as const],
    minify: true,
    outExtension: () => ({ js: '.iife.js' }),
    banner: { js: 'typeof console==="undefined"&&(globalThis.console={log:function(){},warn:function(){},error:function(){}});' },
  })),
]);
