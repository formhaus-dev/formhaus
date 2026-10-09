import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';

const BUDGETS = {
  core: 6400,
  react: 4900,
  vue: 6800,
};

const violations = [];
for (const [name, budget] of Object.entries(BUDGETS)) {
  const result = await build({
    entryPoints: [`packages/${name}/dist/index.js`],
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    logLevel: 'error',
    external: ['@formhaus/core', 'react', 'react/jsx-runtime', 'vue'],
  });
  const size = gzipSync(result.outputFiles[0].contents, { level: 9 }).length;
  console.log(`@formhaus/${name}: ${size} B gzipped (budget ${budget} B)`);
  if (size > budget) violations.push(`@formhaus/${name} is ${size - budget} B over budget`);
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}
