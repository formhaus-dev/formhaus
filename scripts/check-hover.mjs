import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const hoverQuery = /^@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)$/;
const roots = process.argv.slice(2);

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' || entry.name === 'dist' ? [] : files(path);
    return ['.css', '.vue'].includes(extname(entry.name)) ? [path] : [];
  });

const styles = (path, text) =>
  extname(path) === '.vue' ? [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('\n') : text;

const bareHovers = (css) => {
  const found = [];
  const stack = [];
  let prelude = '';
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') {
      const head = prelude.trim().replace(/\s+/g, ' ');
      if (!head.startsWith('@') && head.includes(':hover') && !stack.some((parent) => hoverQuery.test(parent))) found.push(head);
      stack.push(head);
      prelude = '';
    } else if (char === '}') {
      stack.pop();
      prelude = '';
    } else if (char === ';') {
      prelude = '';
    } else {
      prelude += char;
    }
  }
  return found;
};

const failures = roots
  .flatMap(files)
  .flatMap((path) => bareHovers(styles(path, readFileSync(path, 'utf8'))).map((selector) => `${path}: ${selector}`));

if (failures.length) {
  console.error('Wrap :hover rules in @media (hover: hover) and (pointer: fine):');
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
