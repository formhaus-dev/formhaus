import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

export const REACT_EXTERNAL = ['react', 'react/*', 'react-dom', 'react-dom/*'];
export const VUE_EXTERNAL = ['vue'];
const EXTERNAL = { core: [], react: REACT_EXTERNAL, vue: VUE_EXTERNAL };

export const HARD_LIMITS = {
  core: 27648,
  'core + react': 33792,
  'core + vue': 36864,
  'core FormEngine': 19456,
  'core + react useFormEngine': 20480,
  'core + vue useFormEngine': 20480,
  'core + react FormRenderer': 31744,
  'core + vue FormRenderer': 35840,
};

const SUBPATHS = ['cloud', 'i18n', 'fix'];

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
};

export function gzip(contents) {
  return gzipSync(contents, { level: 9 }).length;
}

export async function bundleSize(contents, { external = [], mode = 'production', resolveDir = process.cwd() } = {}) {
  const result = await build({
    stdin: { contents, resolveDir },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'error',
    loader: { '.css': 'empty' },
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    external,
  });
  return gzip(result.outputFiles[0].contents);
}

export function entrySize(name) {
  const { pkg, only, subpath } = ENTRIES[name];
  const dist = `./packages/${pkg}/dist`;
  const lines = [`export ${only ? `{ ${only} }` : '*'} from '${dist}/index.js';`];
  if (subpath) lines.push(`export * from '${dist}/${subpath}.js';`);
  return bundleSize(lines.join('\n'), { external: EXTERNAL[pkg] });
}

export async function measureEntries() {
  for (const pkg of Object.keys(EXTERNAL)) {
    if (!existsSync(`packages/${pkg}/dist/index.js`)) throw new Error(`packages/${pkg}/dist/index.js is missing. Run pnpm build first.`);
  }
  const sizes = {};
  for (const name of Object.keys(ENTRIES)) sizes[name] = await entrySize(name);
  return sizes;
}

export const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;
