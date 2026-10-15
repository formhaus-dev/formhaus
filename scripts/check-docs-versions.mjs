import { readFile } from 'node:fs/promises';

const PACKAGES = ['core', 'react', 'vue'];
const versions = new Map();
for (const name of PACKAGES) versions.set(`@formhaus/${name}`, JSON.parse(await readFile(`packages/${name}/package.json`, 'utf8')).version);

const problems = [];
const expected = versions.get('@formhaus/core');
for (const [name, version] of versions) if (version !== expected) problems.push(`packages: ${name} is ${version}, @formhaus/core is ${expected}`);

const playground = await readFile('docs/.vitepress/components/playground/loaders/versions.ts', 'utf8');
const pinned = playground.match(/FORMHAUS_VERSION = '([^']+)'/)?.[1];
if (pinned !== expected) problems.push(`docs playground FORMHAUS_VERSION is ${pinned}, expected ${expected}`);

const docs = JSON.parse(await readFile('docs/package.json', 'utf8'));
const lock = await readFile('docs/pnpm-lock.yaml', 'utf8');
const importer = lock.slice(lock.indexOf('importers:'), lock.indexOf('\npackages:'));
for (const [name, range] of Object.entries(docs.devDependencies ?? {})) {
  if (!versions.has(name)) continue;
  if (range !== `^${expected}`) problems.push(`docs/package.json ${name} is ${range}, expected ^${expected}`);
  const locked = importer.match(new RegExp(`'${name}':\\n\\s+specifier: [^\\n]+\\n\\s+version: ([^(\\s]+)`))?.[1];
  if (locked !== expected) problems.push(`docs/pnpm-lock.yaml ${name} is ${locked}, expected ${expected}`);
}

if (problems.length) {
  console.error(`Docs and playground pin a different Formhaus version than the workspace:\n${problems.map((problem) => `  ${problem}`).join('\n')}`);
  process.exit(1);
}
console.log(`Docs and playground pin Formhaus ${expected}.`);
