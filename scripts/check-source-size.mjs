import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const MAX_LINES = 250;
const LIMITS = new Map([['packages/core/style.css', 400]]);
const SOURCE_EXTENSIONS = new Set(['.cjs', '.css', '.html', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.vue']);
const IGNORED_DIRECTORIES = new Set(['.agents', '.claude', '.git', '.next', '.nuxt', '.output', 'dist', 'node_modules']);

async function collectSourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectSourceFiles(path)));
    else if (SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const root = process.cwd();
const violations = [];
for (const file of await collectSourceFiles(root)) {
  const source = await readFile(file, 'utf8');
  const lines = source === '' ? 0 : source.split(/\r?\n/).length - Number(source.endsWith('\n'));
  const path = relative(root, file).split('\\').join('/');
  const limit = LIMITS.get(path) ?? MAX_LINES;
  if (lines > limit) violations.push({ file: path, lines, limit });
}

if (violations.length > 0) {
  for (const { file, lines, limit } of violations) {
    console.error(`${file}: ${lines} lines (maximum ${limit})`);
  }
  process.exitCode = 1;
} else {
  console.log(`All source files are at most ${MAX_LINES} lines, packages/core/style.css at most ${LIMITS.get('packages/core/style.css')}.`);
}
