import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const budgets = JSON.parse(readFileSync(new URL('./docs-budgets.json', import.meta.url), 'utf8'));
const dist = process.argv[2] ?? 'docs/.vitepress/dist';
const reactMarker = '__REACT_DEVTOOLS_GLOBAL_HOOK__';
const gz = (file) => gzipSync(readFileSync(file), { level: 9 }).length;

function entries(page) {
  const html = readFileSync(join(dist, page), 'utf8');
  const tags = [...html.matchAll(/<(?:script[^>]*\bsrc|link[^>]*rel="modulepreload"[^>]*\bhref)="(\/[^"]+\.js)"/g)];
  return tags.map((tag) => join(dist, tag[1]));
}

function graph(files) {
  const seen = new Set();
  const queue = [...files];
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    const code = readFileSync(file, 'utf8');
    for (const match of code.matchAll(/(?:^|[;}\s])(?:import|export)\s*(?:[^'"()]*?from\s*)?["'](\.{1,2}\/[^"']+\.js)["']/g)) {
      queue.push(join(dirname(file), match[1]));
    }
  }
  return [...seen];
}

const problems = [];
const landing = graph(entries('index.html'));
const landingSize = landing.reduce((total, file) => total + gz(file), 0);
console.log(`landing initial JS: ${landingSize} B gzipped in ${landing.length} files (budget ${budgets.landing} B)`);
if (landingSize > budgets.landing) problems.push(`the landing initial JS is ${landingSize - budgets.landing} B over budget`);
for (const file of landing) {
  if (readFileSync(file, 'utf8').includes(reactMarker)) problems.push(`${file} puts React on the landing page's initial graph`);
}

const mount = 'packages/editor-react/dist/mount.js';
const mountSize = gz(mount);
console.log(`editor mount chunk: ${mountSize} B gzipped (budget ${budgets.editorMount} B)`);
if (mountSize > budgets.editorMount) problems.push(`the editor mount chunk is ${mountSize - budgets.editorMount} B over budget`);
if (!readFileSync(mount, 'utf8').includes(reactMarker)) problems.push('the React marker is missing from the mount chunk, so the landing check cannot detect React');

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
}
