import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const VERSIONS = {
  'react-hook-form': '7.90.0',
  formik: '2.4.9',
  yup: '1.7.1',
  '@formkit/vue': '2.1.2',
  '@rjsf/core': '6.11.0',
  '@rjsf/utils': '6.11.0',
  '@rjsf/validator-ajv8': '6.11.0',
  'survey-core': '3.2.1',
  'survey-react-ui': '3.2.1',
};

const REACT = ['react', 'react/*', 'react-dom', 'react-dom/*'];
const VUE = ['vue'];

const LIBRARIES = [
  { name: 'react-hook-form', external: REACT, entry: `export { useForm } from 'react-hook-form';` },
  {
    name: 'formik + yup',
    external: REACT,
    entry: `export { useFormik } from 'formik';
export { object, string } from 'yup';`,
  },
  { name: '@formkit/vue', external: VUE, entry: `export { plugin, defaultConfig, FormKit } from '@formkit/vue';` },
  {
    name: '@rjsf/core + validator-ajv8',
    external: REACT,
    entry: `export { default as Form } from '@rjsf/core';
export { default as validator } from '@rjsf/validator-ajv8';`,
  },
  {
    name: 'survey-core + survey-react-ui',
    external: REACT,
    entry: `export { Model } from 'survey-core';
export { Survey } from 'survey-react-ui';`,
  },
];

const CORE = './packages/core/dist';
const REACT_DIST = './packages/react/dist/index.js';
const VUE_DIST = './packages/vue/dist/index.js';

const FORMHAUS = [
  { name: '@formhaus/core FormEngine', external: [], entry: `export { FormEngine } from '${CORE}/index.js';` },
  {
    name: '@formhaus/core FormEngine + checkDefinition',
    external: [],
    entry: `export { FormEngine, checkDefinition } from '${CORE}/index.js';`,
  },
  ...['cloud', 'i18n', 'fix'].map((subpath) => ({
    name: `@formhaus/core FormEngine + /${subpath}`,
    external: [],
    entry: `export { FormEngine } from '${CORE}/index.js';\nexport * from '${CORE}/${subpath}.js';`,
  })),
  { name: '@formhaus/react useFormEngine', external: REACT, entry: `export { useFormEngine } from '${REACT_DIST}';` },
  { name: '@formhaus/react HeadlessFormRenderer', external: REACT, entry: `export { HeadlessFormRenderer } from '${REACT_DIST}';` },
  { name: '@formhaus/react FormRenderer', external: REACT, entry: `export { FormRenderer } from '${REACT_DIST}';` },
  { name: '@formhaus/core + @formhaus/react', external: REACT, entry: `export * from '${REACT_DIST}';` },
  { name: '@formhaus/vue useFormEngine', external: VUE, entry: `export { useFormEngine } from '${VUE_DIST}';` },
  { name: '@formhaus/vue HeadlessFormRenderer', external: VUE, entry: `export { HeadlessFormRenderer } from '${VUE_DIST}';` },
  { name: '@formhaus/vue FormRenderer', external: VUE, entry: `export { FormRenderer } from '${VUE_DIST}';` },
  { name: '@formhaus/core + @formhaus/vue', external: VUE, entry: `export * from '${VUE_DIST}';` },
];

for (const pkg of ['core', 'react', 'vue']) {
  if (!existsSync(`packages/${pkg}/dist/index.js`)) {
    console.error(`packages/${pkg}/dist/index.js is missing. Run pnpm build first.`);
    process.exit(1);
  }
}

const dir = mkdtempSync(join(tmpdir(), 'formhaus-bundle-compare-'));
try {
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ private: true }));
  const specs = Object.entries(VERSIONS).map(([name, version]) => `${name}@${version}`);
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts', '--legacy-peer-deps', '--min-release-age=0', ...specs], {
    cwd: dir,
    stdio: 'inherit',
  });

  const rows = [];
  for (const library of LIBRARIES) rows.push([library.name, await bundleSize(library, dir)]);
  for (const library of FORMHAUS) rows.push([library.name, await bundleSize(library, process.cwd())]);

  console.log('');
  for (const [name, size] of rows) console.log(`${name}: ${size} B (${(size / 1024).toFixed(1)} KB) gzipped`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

async function bundleSize({ entry, external }, resolveDir) {
  const result = await build({
    stdin: { contents: entry, resolveDir },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'error',
    loader: { '.css': 'empty' },
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    external,
  });
  return gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
}
