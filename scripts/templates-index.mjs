import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../templates/', import.meta.url));
const indexPath = resolve(directory, 'index.json');
const SKIP = new Set(['index.json', 'order.json']);

const countNodes = (nodes) => nodes.reduce((total, node) => total + (node.type === 'section' ? countNodes(node.fields) : 1), 0);
const countFields = ({ fields = [], steps = [] }) => countNodes(fields) + steps.reduce((total, step) => total + countNodes(step.fields), 0);

export function readOrder() {
  return JSON.parse(readFileSync(resolve(directory, 'order.json'), 'utf8'));
}

export function buildIndex(templates, order = readOrder()) {
  const rank = new Map(order.map((slug, position) => [slug, position]));
  const missing = templates.filter(({ slug }) => !rank.has(slug)).map(({ slug }) => slug);
  if (missing.length) throw new Error(`templates/order.json is missing: ${missing.join(', ')}`);
  return templates
    .map(({ slug, title, summary, category, definition }) => ({
      slug,
      title,
      summary,
      category,
      steps: definition.steps?.length || 1,
      fields: countFields(definition),
    }))
    .sort((a, b) => rank.get(a.slug) - rank.get(b.slug));
}

function readTemplates() {
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json') && !SKIP.has(name))
    .map((name) => JSON.parse(readFileSync(resolve(directory, name), 'utf8')));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const expected = `${JSON.stringify(buildIndex(readTemplates()), null, 2)}\n`;
  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(indexPath, 'utf8');
    } catch {}
    if (current !== expected) {
      console.error('templates/index.json is stale. Run pnpm templates.');
      process.exitCode = 1;
    } else console.log('templates/index.json is up to date.');
  } else {
    writeFileSync(indexPath, expected);
    console.log(`Wrote ${indexPath}`);
  }
}
