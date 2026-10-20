import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const ENTRIES = {
  core: ['index', 'cloud', 'server', 'i18n', 'fix'],
  react: ['index', 'cloud', 'i18n'],
  vue: ['index', 'cloud', 'i18n'],
};
const IMPORT = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
const failures = [];
let checked = 0;

function visit(file, seen, entry) {
  if (seen.has(file)) return;
  seen.add(file);
  checked++;
  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(IMPORT)) {
    if (specifier === '@formhaus/core/internal' || /(^|\/)internal(\.d\.ts|\.js)?$/.test(specifier)) {
      failures.push(`${relative(root, file)} (from ${entry}) imports ${specifier}`);
      continue;
    }
    if (!specifier.startsWith('.')) continue;
    const base = join(dirname(file), specifier.replace(/\.(js|d\.ts)$/, ''));
    const next = [`${base}.d.ts`, join(base, 'index.d.ts')].find(existsSync);
    if (next) visit(next, seen, entry);
    else failures.push(`${relative(root, file)} (from ${entry}) imports ${specifier}, which has no .d.ts`);
  }
}

for (const [pkg, entries] of Object.entries(ENTRIES)) {
  for (const entry of entries) {
    const file = join(root, 'packages', pkg, 'dist', `${entry}.d.ts`);
    if (!existsSync(file)) failures.push(`${relative(root, file)} is missing; run pnpm build first`);
    else visit(file, new Set(), `${pkg}/${entry}`);
  }
}

const core = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')).version;
const [major, minor] = core.split('.');
const floor = core.includes('-') ? core : `${major}.${minor}.0`;
const pinned = `${major === '0' ? '^' : '~'}${floor}`;
for (const pkg of ['react', 'vue']) {
  const range = JSON.parse(readFileSync(join(root, 'packages', pkg, 'package.json'), 'utf8')).peerDependencies?.['@formhaus/core'];
  if (range !== pinned)
    failures.push(`packages/${pkg}/package.json: peer @formhaus/core is ${range}, expected ${pinned} to match core ${core}`);
}

if (failures.length > 0) {
  console.error(`@formhaus/core/internal boundary:\n${failures.map((failure) => `  ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(`${checked} public .d.ts files reference no internal types, and the adapters pin core ${pinned}`);
