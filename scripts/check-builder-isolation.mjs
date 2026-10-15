import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PRIVATE = { '@formhaus/builder': 'builder', '@formhaus/editor-react': 'editor-react' };
const PUBLISHED = ['core', 'react', 'vue', 'mcp', 'formhaus'];
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'bundleDependencies'];
const SCANNED = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.tsx', '.vue', '.map']);
const pattern = new RegExp(
  Object.entries(PRIVATE)
    .flatMap(([name, dir]) => [name, `packages/${dir}`])
    .join('|'),
);

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') result.push(...(await files(path)));
    else if (SCANNED.has(entry.name.slice(entry.name.lastIndexOf('.')))) result.push(path);
  }
  return result;
}

const problems = [];
const changesets = JSON.parse(await readFile('.changeset/config.json', 'utf8'));
const notes = [];
for (const name of await readdir('.changeset')) {
  if (name.endsWith('.md') && name !== 'README.md') notes.push([name, await readFile(join('.changeset', name), 'utf8')]);
}
for (const [pkg, dir] of Object.entries(PRIVATE)) {
  const manifest = JSON.parse(await readFile(join('packages', dir, 'package.json'), 'utf8'));
  if (manifest.private !== true) problems.push(`packages/${dir}/package.json must stay "private": true`);
  if (!changesets.ignore?.includes(pkg)) problems.push(`.changeset/config.json must list ${pkg} in "ignore"`);
  for (const [name, text] of notes) if (text.includes(pkg)) problems.push(`.changeset/${name} must not version ${pkg}`);
}

for (const name of PUBLISHED) {
  const manifest = JSON.parse(await readFile(join('packages', name, 'package.json'), 'utf8'));
  for (const field of DEPENDENCY_FIELDS) {
    for (const pkg of Object.keys(PRIVATE)) {
      if (manifest[field] && pkg in manifest[field]) problems.push(`packages/${name}/package.json lists ${pkg} in ${field}`);
    }
  }
  for (const file of [...(await files(join('packages', name, 'src'))), ...(await files(join('packages', name, 'dist')))]) {
    if (pattern.test(await readFile(file, 'utf8'))) problems.push(`${file} references a private package`);
  }
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
} else {
  console.log(`${Object.keys(PRIVATE).join(' and ')} stay out of published packages.`);
}
