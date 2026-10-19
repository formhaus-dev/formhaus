import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'docs/.vitepress/dist/templates');
const aliases = JSON.parse(readFileSync(join(root, 'docs/.vitepress/template-aliases.json'), 'utf8'));
const problems = [];

for (const [from, to] of Object.entries(aliases)) {
  const target = join(root, 'templates', `${to}.json`);
  if (!existsSync(target)) problems.push(`${from}: target ${to} does not exist`);
  if (existsSync(join(root, 'templates', `${from}.json`))) problems.push(`${from}: a template with this slug still exists`);
  const page = join(dist, `${from}.html`);
  const json = join(dist, `${from}.json`);
  if (!existsSync(page)) problems.push(`${from}: missing /templates/${from}`);
  if (!existsSync(json)) problems.push(`${from}: missing /templates/${from}.json`);
  else if (existsSync(target) && readFileSync(json, 'utf8') !== readFileSync(target, 'utf8'))
    problems.push(`${from}.json differs from ${to}.json`);
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
console.log(`${Object.keys(aliases).length} template aliases resolve.`);
