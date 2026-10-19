import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const HARD_LIMITS = {
  'core + react': 28672,
  'core + vue': 31168,
  core: 23552,
};

const APPS = {
  'core + react': { pkg: 'react', external: ['react', 'react-dom', 'react/jsx-runtime'] },
  'core + vue': { pkg: 'vue', external: ['vue'] },
  core: { pkg: 'core', external: [] },
};

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

const BUDGETS = JSON.parse(readFileSync(new URL('./bundle-budgets.json', import.meta.url), 'utf8'));
const json = process.argv.includes('--json');
const log = json ? () => {} : console.log;

const sizes = { budgets: {}, apps: {} };
const violations = [];

for (const [name, budget] of Object.entries(BUDGETS)) {
  const [target, mode = 'development'] = name.split(':');
  const [module, only] = target.split('#');
  const [pkg, entry = 'index'] = module.split('/');
  const file = `./packages/${pkg}/dist/${entry}.js`;
  const size = entry.endsWith('.css')
    ? gzip(readFileSync(`packages/${pkg}/${entry}`))
    : await bundleSize(only ? `export { ${only} } from '${file}';` : `export * from '${file}';`, mode, PACKAGE_EXTERNALS);
  sizes.budgets[name] = size;
  log(`@formhaus/${name}: ${size} B gzipped (budget ${budget} B)`);
  if (size > budget) violations.push(`@formhaus/${name} is ${size - budget} B over budget`);
}

log('');
for (const [name, limit] of Object.entries(HARD_LIMITS)) {
  const { pkg, external } = APPS[name];
  const size = await bundleSize(`export * from './packages/${pkg}/dist/index.js';`, 'production', external);
  sizes.apps[name] = size;
  log(`${name}: ${size} B gzipped (hard limit ${limit} B, headroom ${limit - size} B)`);
  if (size > limit) violations.push(`${name} is ${size - limit} B over the hard limit`);
}

if (json) console.log(JSON.stringify(sizes, null, 2));

async function bundleSize(contents, mode, external) {
  const result = await build({
    stdin: { contents, resolveDir: process.cwd() },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    external,
  });
  return gzip(result.outputFiles[0].contents);
}

function gzip(contents) {
  return gzipSync(contents, { level: 9 }).length;
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
