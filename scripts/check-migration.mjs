import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { checkDefinition } = await import(pathToFileURL(resolve('packages/core/dist/index.js')).href);

const GUIDE = 'docs/migrate';
const REMOVED = [/nextStepAsync\(/, /prevStepAsync\(/, /skipStepAsync\(/, /submitAsync\(/, /\.nextStep\(/, /\.prevStep\(/, /\.skipStep\(/, /validateDefinition\(/, /isStepVisible\(/, /ActionsComponent=/, /ProgressComponent=/, /onStepChange=/, /@step-change/, /:submit-handler/, /'update:value'/, /form_abandoned/, /\bdirection\b/, /as FormDefinition\b/];
const SKIPPED = new Set(['node_modules', '.vitepress', 'migrate', 'public', 'cloud']);

const guide = (await Promise.all((await readdir(GUIDE)).filter((name) => name.endsWith('.md')).map((name) => readFile(join(GUIDE, name), 'utf8')))).join('\n');
const rows = guide.split('\n').filter((line) => line.startsWith('|')).join('\n').replace(/\\\|/g, '|');
const problems = [];

for (const name of await readdir('.changeset')) {
  if (!name.endsWith('.md') || name === 'README.md') continue;
  for (const line of (await readFile(join('.changeset', name), 'utf8')).split('\n')) {
    if (!line.startsWith('- **Breaking:**')) continue;
    const span = line.match(/`([^`]+)`/)?.[1];
    if (!span) problems.push(`.changeset/${name}: Breaking bullet without a code span: ${line.slice(0, 80)}`);
    else if (!rows.includes(`\`${span}\``)) problems.push(`.changeset/${name}: no row in ${GUIDE} for \`${span}\``);
  }
}

async function markdown(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (SKIPPED.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdown(path));
    else if (entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

for (const file of [...await markdown('docs'), 'README.md', ...['core', 'react', 'vue', 'mcp'].map((name) => `packages/${name}/README.md`)]) {
  const source = await readFile(file, 'utf8');
  for (const removed of REMOVED) if (removed.test(source)) problems.push(`${file} uses the removed API ${removed.source}`);
  for (const [, block] of source.matchAll(/```json[^\n]*\n([\s\S]*?)```/g)) {
    let definition;
    try { definition = JSON.parse(block); } catch { continue; }
    if (!definition?.id || !definition.submit || !(definition.fields || definition.steps)) continue;
    for (const issue of checkDefinition(definition)) if (issue.severity === 'error') problems.push(`${file}: definition "${definition.id}": ${issue.message}`);
  }
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
} else {
  console.log('Every breaking change has a migration row, the docs use no removed API, and every docs definition passes checkDefinition().');
}
