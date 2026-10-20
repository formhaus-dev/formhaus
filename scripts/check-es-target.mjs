import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'acorn';

const root = join(import.meta.dirname, '..');
const failures = [];
let checked = 0;

for (const pkg of ['core', 'react', 'vue']) {
  const dist = join(root, 'packages', pkg, 'dist');
  const files = readdirSync(dist, { recursive: true }).filter((file) => file.endsWith('.js'));
  if (files.length === 0) failures.push(`packages/${pkg}/dist has no .js files; run pnpm build first`);
  for (const file of files) {
    const path = join(dist, file);
    try {
      parse(readFileSync(path, 'utf8'), { ecmaVersion: 2020, sourceType: file.endsWith('.iife.js') ? 'script' : 'module' });
      checked++;
    } catch (error) {
      failures.push(`${relative(root, path)}: ${error.message}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Syntax newer than ES2020 in published files:\n${failures.map((failure) => `  ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(`${checked} published files parse as ES2020`);
