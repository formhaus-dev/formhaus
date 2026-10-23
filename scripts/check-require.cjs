const { createRequire } = require('node:module');
const { readdirSync, readFileSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { buildSync } = require('esbuild');

const root = join(__dirname, '..');
const failures = [];

function expand(dir, subpath, file) {
  if (!subpath.includes('*')) return [[subpath, file]];
  const [prefix, suffix] = file.split('*');
  return readdirSync(join(dir, dirname(file)))
    .map((name) => `${dirname(file)}/${name}`.replace(/^\.\//, './'))
    .filter((path) => path.startsWith(prefix) && path.endsWith(suffix))
    .map((path) => [subpath.replace('*', path.slice(prefix.length, path.length - suffix.length)), path]);
}

for (const pkg of ['core', 'react', 'vue']) {
  const dir = join(root, 'packages', pkg);
  const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const requireFrom = createRequire(join(dir, 'package.json'));
  for (const [pattern, target] of Object.entries(manifest.exports)) {
    if (typeof target !== 'object') continue;
    if (!target.default?.endsWith('.js')) {
      failures.push(`${pattern === '.' ? manifest.name : `${manifest.name}${pattern.slice(1)}`}: missing a default .js condition`);
      continue;
    }
    for (const [subpath, file] of expand(dir, pattern, target.default)) {
      const id = subpath === '.' ? manifest.name : `${manifest.name}${subpath.slice(1)}`;
      try {
        buildSync({
          entryPoints: [join(dir, file)],
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
}

if (failures.length > 0) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
}
