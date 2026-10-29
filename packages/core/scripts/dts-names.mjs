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

if (aliases.size === 0) throw new Error(`No declaration chunks found in ${dist}`);

let linked = 0;
for (const source of sources) {
  source.text = source.text.replace(FROM, (statement, kind, type = '', list, path) => {
    const target = resolve(dirname(source.file), `${path}.d.ts`);
    const names = aliases.get(target);
    if (!names) return statement;
    const exported = new Set(names.values());
    const items = specifiers(list).map(({ name, alias }) => ({ name: names.get(name) ?? name, alias }));
    const missing = items.find(({ name }) => !exported.has(name));
    if (missing) throw new Error(`${relative(dist, source.file)} imports ${missing.name} that ${relative(dist, target)} does not export`);
    linked += 1;
    return `${kind}${type} { ${items.map(named).join(', ')} } from '${path}.js';`;
  });
  writeFileSync(source.file, source.text);
}

if (linked === 0) throw new Error(`No imports of declaration chunks matched in ${dist}`);
const left = sources.find(({ text }) => /\{[^}]*\b[\w$]{1,2} as [\w$]+[^}]*\} from/.test(text));
if (left) throw new Error(`${relative(dist, left.file)} still imports a minified type name`);

console.log(`Kept type names in ${aliases.size} declaration chunks of ${relative(process.cwd(), dist)}`);
