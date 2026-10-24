import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

export const REACT_EXTERNAL = ['react', 'react/*', 'react-dom', 'react-dom/*'];
export const VUE_EXTERNAL = ['vue'];
const EXTERNAL = { core: [], react: REACT_EXTERNAL, vue: VUE_EXTERNAL };

const SUBPATHS = ['cloud', 'i18n', 'fix', 'research', 'schema', 'fields'];

const ENTRIES = {
  core: { pkg: 'core' },
  'core + react': { pkg: 'react' },
  'core + vue': { pkg: 'vue' },
  'core FormEngine': { pkg: 'core', only: 'FormEngine' },
  'core FormEngine + checkDefinition': { pkg: 'core', only: 'FormEngine, checkDefinition' },
  ...Object.fromEntries(SUBPATHS.map((subpath) => [`core FormEngine + /${subpath}`, { pkg: 'core', only: 'FormEngine', subpath }])),
  ...Object.fromEntries(
    ['react', 'vue'].flatMap((pkg) =>
      ['useFormEngine', 'HeadlessFormRenderer', 'FormRenderer'].map((only) => [`core + ${pkg} ${only}`, { pkg, only }]),
    ),
  ),
  ...Object.fromEntries(
    ['react', 'vue'].map((pkg) => [`core + ${pkg} FormRenderer + /controls`, { pkg, only: 'FormRenderer', subpath: 'controls' }]),
  ),
  'core FormEngine (trusted)': { pkg: 'core', only: 'FormEngine', trusted: true },
  'core + react FormRenderer (trusted)': { pkg: 'react', only: 'FormRenderer', trusted: true },
  'core + vue FormRenderer (trusted)': { pkg: 'vue', only: 'FormRenderer', trusted: true },
};

export const TRUSTED = { 'process.env.FORMHAUS_TRUSTED': JSON.stringify('1') };

export function gzip(contents) {
  return gzipSync(contents, { level: 9 }).length;
}

const SELF = Object.fromEntries(['react', 'vue'].map((pkg) => [`@formhaus/${pkg}`, `./packages/${pkg}/dist/index.js`]));

export async function bundleSize(contents, { external = [], mode = 'production', resolveDir = process.cwd(), define = {} } = {}) {
  const result = await build({
    stdin: { contents, resolveDir },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'error',
    loader: { '.css': 'empty' },
    define: { 'process.env.NODE_ENV': JSON.stringify(mode), ...define },
    external,
    alias: Object.fromEntries(Object.entries(SELF).filter(([name]) => !external.includes(name))),
  });
  return gzip(result.outputFiles[0].contents);
}

function entrySize(name) {
  const { pkg, only, subpath, trusted } = ENTRIES[name];
  const dist = `./packages/${pkg}/dist`;
  const lines = [`export ${only ? `{ ${only} }` : '*'} from '${dist}/index.js';`];
  if (subpath) lines.push(`export * from '${dist}/${subpath}.js';`);
  return bundleSize(lines.join('\n'), { external: EXTERNAL[pkg], define: trusted ? TRUSTED : {} });
}

export async function measureEntries(names = Object.keys(ENTRIES)) {
  for (const pkg of Object.keys(EXTERNAL)) {
    if (!existsSync(`packages/${pkg}/dist/index.js`)) throw new Error(`packages/${pkg}/dist/index.js is missing. Run pnpm build first.`);
  }
  const sizes = {};
  for (const name of names) sizes[name] = await entrySize(name);
  return sizes;
}

export const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
