import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGETS = JSON.parse(readFileSync(new URL('./bundle-budgets.json', import.meta.url), 'utf8'));

const violations = [];
for (const [name, budget] of Object.entries(BUDGETS)) {
  const [target, mode = 'development'] = name.split(':');
  const [module, only] = target.split('#');
  const [pkg, entry = 'index'] = module.split('/');
  const size = entry.endsWith('.css') ? gzipSync(readFileSync(`packages/${pkg}/${entry}`), { level: 9 }).length : await bundleSize(pkg, entry, only, mode);
  console.log(`@formhaus/${name}: ${size} B gzipped (budget ${budget} B)`);
  if (size > budget) violations.push(`@formhaus/${name} is ${size - budget} B over budget`);
}

async function bundleSize(pkg, entry, only, mode) {
  const file = `./packages/${pkg}/dist/${entry}.js`;
  const result = await build({
    stdin: { contents: only ? `export { ${only} } from '${file}';` : `export * from '${file}';`, resolveDir: process.cwd() },
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'error',
    define: { 'process.env.NODE_ENV': JSON.stringify(mode) },
    external: ['@formhaus/core', '@formhaus/core/cloud', '@formhaus/core/internal', '@formhaus/react', '@formhaus/vue', 'react', 'react/jsx-runtime', 'vue'],
  });
  return gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
