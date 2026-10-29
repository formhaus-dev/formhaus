import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = join(import.meta.dirname, '..');
const ENTRIES = {
  core: [
    'index',
    'cloud',
    'server',
    'i18n',
    'fix',
    'research',
    'fields',
    'controls',
    'schema',
    ...readdirSync(join(root, 'packages/core/locales')).map((file) => `locales/${file.replace('.json', '')}`),
  ],
  react: ['index', 'cloud', 'controls'],
  vue: ['index', 'cloud', 'controls'],
};
const IMPORT = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
const failures = [];
let checked = 0;

function visit(file, seen, entry) {
  if (seen.has(file)) return;
  seen.add(file);
  checked++;
  for (const [, specifier] of readFileSync(file, 'utf8').matchAll(IMPORT)) {
    if (/^@formhaus\/core\/internal(\/|$)/.test(specifier) || /(^|\/)internal(\/cloud)?(\.d\.ts|\.js)?$/.test(specifier)) {
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

const DECLARED =
  /^(?:export )?(?:declare )?(?:abstract )?(?:const )?(?:interface|type|class|const|let|var|function|enum|namespace) (\w+)/gm;
const LISTED = /^export (?:type )?\{([^}]*)\}/gm;
for (const pkg of ['react', 'vue']) {
  const main = readFileSync(join(root, 'packages', pkg, 'dist/index.d.ts'), 'utf8');
  const exported = new Set([
    ...[...main.matchAll(DECLARED)].filter(([line]) => line.startsWith('export')).map(([, name]) => name),
    ...[...main.matchAll(LISTED)].flatMap(([, list]) => list.split(',').map((item) => item.trim().split(/\s+/).at(-1))),
  ]);
  for (const entry of ENTRIES[pkg].filter((name) => name !== 'index')) {
    const file = join('packages', pkg, 'dist', `${entry}.d.ts`);
    for (const [, name] of readFileSync(join(root, file), 'utf8').matchAll(DECLARED))
      if (exported.has(name)) failures.push(`${file} redeclares ${name}; import it from @formhaus/${pkg}`);
  }
}

const core = JSON.parse(readFileSync(join(root, 'packages/core/package.json'), 'utf8')).version;
const pinned = `${core.startsWith('0.') ? '^' : '~'}${core}`;
for (const pkg of ['react', 'vue']) {
  const range = JSON.parse(readFileSync(join(root, 'packages', pkg, 'package.json'), 'utf8')).peerDependencies?.['@formhaus/core'];
  if (range !== pinned)
    failures.push(`packages/${pkg}/package.json: peer @formhaus/core is ${range}, expected ${pinned} to match core ${core}`);
}

if (failures.length > 0) {
  console.error(`Public .d.ts boundaries:\n${failures.map((failure) => `  ${failure}`).join('\n')}`);
  process.exit(1);
}

console.log(
  `${checked} public .d.ts files reference no internal types, subpaths reuse the main entry types, and the adapters pin core ${pinned}`,
);
