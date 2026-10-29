import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

const dist = resolve(import.meta.dirname, '../dist');
const CHUNK = /-[\w-]{8}\.d\.ts$/;
const OWN_EXPORT = /export( type)? \{([^}]*)\};/g;
const FROM = /(import|export)( type)? \{([^}]*)\} from '(\.{1,2}\/[^']+)\.js';/g;

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(join(dir, entry.name)) : entry.name.endsWith('.d.ts') ? [join(dir, entry.name)] : [],
  );

const specifiers = (list) =>
  list
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, alias = name] = item.split(/\s+as\s+/);
      return { name, alias };
    });

const named = ({ name, alias }) => (name === alias ? name : `${name} as ${alias}`);

const sources = files(dist).map((file) => ({ file, text: readFileSync(file, 'utf8') }));
const aliases = new Map();

for (const source of sources) {
  if (!CHUNK.test(basename(source.file))) continue;
  const names = new Map();
  source.text = source.text.replace(OWN_EXPORT, (_, type = '', list) => {
    const items = specifiers(list);
    for (const { name, alias } of items) names.set(alias, name);
    return `export${type} { ${items.map(({ name }) => name).join(', ')} };`;
  });
  aliases.set(source.file, names);
}

for (const source of sources) {
  source.text = source.text.replace(FROM, (statement, kind, type = '', list, path) => {
    const target = resolve(dirname(source.file), `${path}.d.ts`);
    const names = aliases.get(target);
    if (!names) return statement;
    const items = specifiers(list).map(({ name, alias }) => ({ name: names.get(name) ?? name, alias }));
    return `${kind}${type} { ${items.map(named).join(', ')} } from '${path}.js';`;
  });
  writeFileSync(source.file, source.text);
}

console.log(`Kept type names in ${aliases.size} declaration chunks of ${relative(process.cwd(), dist)}`);
