const { createRequire } = require('node:module');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { buildSync } = require('esbuild');

const root = join(__dirname, '..');
const failures = [];

for (const pkg of ['core', 'react', 'vue']) {
  const dir = join(root, 'packages', pkg);
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const requireFrom = createRequire(join(dir, 'package.json'));
  for (const [subpath, target] of Object.entries(manifest.exports)) {
    if (typeof target !== 'object') continue;
    const id = subpath === '.' ? manifest.name : `${manifest.name}${subpath.slice(1)}`;
    if (!target.default?.endsWith('.js')) {
      failures.push(`${id}: missing a default .js condition`);
      continue;
    }
    try {
      buildSync({
        entryPoints: [join(dir, target.default)],
        bundle: true,
        packages: 'external',
        tsconfigRaw: {},
        format: 'cjs',
        write: false,
        logLevel: 'silent',
      });
    } catch (error) {
      failures.push(`${id}: ${error.errors?.[0]?.text ?? error.message}`);
      continue;
    }
    try {
      const loaded = requireFrom(id);
      if (Object.keys(loaded).length === 0) throw new Error('no exports');
      console.log(`require('${id}') OK`);
    } catch (error) {
      failures.push(`${id}: ${error.code ?? ''} ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
}
