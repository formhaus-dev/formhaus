import { readFile, writeFile } from 'node:fs/promises';

const version = process.argv[2] ?? '';
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Usage: node scripts/bump-docs-pins.mjs <version>, got "${version}"`);
  process.exit(1);
}

const manifest = 'docs/package.json';
const docs = JSON.parse(await readFile(manifest, 'utf8'));
for (const name of ['@formhaus/core', '@formhaus/react', '@formhaus/vue']) {
  for (const group of ['dependencies', 'devDependencies']) {
    if (docs[group]?.[name]) docs[group][name] = `^${version}`;
  }
}
await writeFile(manifest, `${JSON.stringify(docs, null, 2)}\n`);
console.log(`Docs pins set to ${version}.`);
