import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';

const source = new URL('../locales/', import.meta.url);
const dist = new URL('../dist/locales/', import.meta.url);

mkdirSync(dist, { recursive: true });
for (const file of readdirSync(source).filter((name) => name.endsWith('.json'))) {
  const name = file.slice(0, -'.json'.length);
  const catalog = JSON.parse(readFileSync(new URL(file, source), 'utf8'));
  writeFileSync(new URL(`${name}.js`, dist), `export default ${JSON.stringify(catalog)};\n`);
  writeFileSync(
    new URL(`${name}.d.ts`, dist),
    `import type { LocaleCatalog } from '../index.js';\ndeclare const catalog: LocaleCatalog;\nexport default catalog;\n`,
  );
}
