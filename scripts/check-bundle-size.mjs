import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const BUDGETS = {
  core: 6460,
  react: 4950,
  vue: 6800,
  'core/cloud': 1200,
  'react/cloud': 650,
  'vue/cloud': 1000,
  'core/style.css': 2450,
};

const violations = [];
for (const [name, budget] of Object.entries(BUDGETS)) {
  const [pkg, entry = 'index'] = name.split('/');
  const size = entry.endsWith('.css') ? gzipSync(readFileSync(`packages/${pkg}/${entry}`), { level: 9 }).length : await bundleSize(pkg, entry);
  console.log(`@formhaus/${name}: ${size} B gzipped (budget ${budget} B)`);
  if (size > budget) violations.push(`@formhaus/${name} is ${size - budget} B over budget`);
}

async function bundleSize(pkg, entry) {
  const result = await build({
    entryPoints: [`packages/${pkg}/dist/${entry}.js`],
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'error',
    external: ['@formhaus/core', '@formhaus/core/cloud', '@formhaus/react', '@formhaus/vue', 'react', 'react/jsx-runtime', 'vue'],
  });
  return gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
