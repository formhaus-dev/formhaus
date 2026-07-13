import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const MAX_LINES = 220;
const SOURCE_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.jsx',
  '.mjs',
  '.ts',
  '.tsx',
  '.vue',
]);
const IGNORED_DIRECTORIES = new Set([
  '.agents',
  '.claude',
  '.git',
  'dist',
  'node_modules',
]);

async function collectSourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectSourceFiles(path));
    else if (SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const root = process.cwd();
const violations = [];
for (const file of await collectSourceFiles(root)) {
  const source = await readFile(file, 'utf8');
  const lines = source === '' ? 0 : source.split(/\r?\n/).length - Number(source.endsWith('\n'));
  if (lines > MAX_LINES) violations.push({ file: relative(root, file), lines });
}

if (violations.length > 0) {
  for (const { file, lines } of violations) {
    console.error(`${file}: ${lines} lines (maximum ${MAX_LINES})`);
  }
  process.exitCode = 1;
} else {
  console.log(`All source files are at most ${MAX_LINES} lines.`);
}
