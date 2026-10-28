import { readFileSync } from 'node:fs';
import { bundleSize, gzip, measureEntries } from './size/measure.mjs';

const PACKAGE_EXTERNALS = [
  '@formhaus/core',
  '@formhaus/core/cloud',
  '@formhaus/core/internal',
  '@formhaus/core/internal/cloud',
  '@formhaus/core/i18n',
  '@formhaus/core/fix',
  '@formhaus/core/research',
  '@formhaus/core/fields',
  '@formhaus/core/controls',
  '@formhaus/core/schema',
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

for (const name of ENTRIES) {
  const [target, mode = 'development'] = name.split(':');
  const [module, only] = target.split('#');
  const [pkg, ...path] = module.split('/');
  const entry = path.join('/') || 'index';
  const file = `./packages/${pkg}/dist/${entry}.js`;
  const exported = only ? `{ ${only} }` : entry.startsWith('locales/') ? '{ default }' : '*';
  const size = entry.endsWith('.css')
    ? gzip(readFileSync(`packages/${pkg}/${entry}`))
    : await bundleSize(`export ${exported} from '${file}';`, { mode, external: PACKAGE_EXTERNALS });
  sizes.budgets[name] = size;
  log(`@formhaus/${name}: ${size} B gzipped`);
}

log('');
sizes.apps = await measureEntries();
for (const [name, size] of Object.entries(sizes.apps)) log(`${name}: ${size} B gzipped`);

if (json) console.log(JSON.stringify(sizes, null, 2));
