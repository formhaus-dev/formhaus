import { readFileSync } from 'node:fs';
import { bundleSize, entrySize, gzip, HARD_LIMITS } from './size/measure.mjs';

const PACKAGE_EXTERNALS = [
  '@formhaus/core',
  '@formhaus/core/cloud',
  '@formhaus/core/internal',
  '@formhaus/core/i18n',
  '@formhaus/core/fix',
  '@formhaus/react',
  '@formhaus/vue',
  'react',
  'react/jsx-runtime',
  'vue',
];

const ENTRIES = JSON.parse(readFileSync(new URL('./bundle-entries.json', import.meta.url), 'utf8'));
const json = process.argv.includes('--json');
const log = json ? () => {} : console.log;

const sizes = { budgets: {}, apps: {} };
const violations = [];

for (const name of ENTRIES) {
  const [target, mode = 'development'] = name.split(':');
  const [module, only] = target.split('#');
  const [pkg, entry = 'index'] = module.split('/');
  const file = `./packages/${pkg}/dist/${entry}.js`;
  const size = entry.endsWith('.css')
    ? gzip(readFileSync(`packages/${pkg}/${entry}`))
    : await bundleSize(only ? `export { ${only} } from '${file}';` : `export * from '${file}';`, { mode, external: PACKAGE_EXTERNALS });
  sizes.budgets[name] = size;
  log(`@formhaus/${name}: ${size} B gzipped`);
}

log('');
for (const [name, limit] of Object.entries(HARD_LIMITS)) {
  const size = await entrySize(name);
  sizes.apps[name] = size;
  log(`${name}: ${size} B gzipped (hard limit ${limit} B, headroom ${limit - size} B)`);
  if (size > limit) violations.push(`${name} is ${size - limit} B over the hard limit`);
}

if (json) console.log(JSON.stringify(sizes, null, 2));

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
