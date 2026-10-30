import { readFile, writeFile } from 'node:fs/promises';

const read = async (url) => JSON.parse(await readFile(url, 'utf8'));
const { version } = await read(new URL('../packages/core/package.json', import.meta.url));

for (const name of ['react', 'vue']) {
  const url = new URL(`../packages/${name}/package.json`, import.meta.url);
  const pkg = await read(url);
  pkg.peerDependencies['@formhaus/core'] = `~${version}`;
  await writeFile(url, `${JSON.stringify(pkg, null, 2)}\n`);
}
