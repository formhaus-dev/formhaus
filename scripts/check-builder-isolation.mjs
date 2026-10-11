import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const BUILDER = '@formhaus/builder';
const PUBLISHED = ['core', 'react', 'vue', 'mcp'];
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'bundleDependencies'];
const SCANNED = new Set(['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.tsx', '.vue', '.map']);
const pattern = /@formhaus\/builder|packages\/builder/;

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const result = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') result.push(...await files(path));
    else if (SCANNED.has(entry.name.slice(entry.name.lastIndexOf('.')))) result.push(path);
  }
  return result;
}

const problems = [];
const builder = JSON.parse(await readFile('packages/builder/package.json', 'utf8'));
if (builder.private !== true) problems.push('packages/builder/package.json must stay "private": true');

const changesets = JSON.parse(await readFile('.changeset/config.json', 'utf8'));
if (!changesets.ignore?.includes(BUILDER)) problems.push(`.changeset/config.json must list ${BUILDER} in "ignore"`);
for (const name of await readdir('.changeset')) {
  if (name.endsWith('.md') && name !== 'README.md' && (await readFile(join('.changeset', name), 'utf8')).includes(BUILDER)) {
    problems.push(`.changeset/${name} must not version ${BUILDER}`);
  }
}

for (const name of PUBLISHED) {
  const manifest = JSON.parse(await readFile(join('packages', name, 'package.json'), 'utf8'));
  for (const field of DEPENDENCY_FIELDS) {
    if (manifest[field] && BUILDER in manifest[field]) problems.push(`packages/${name}/package.json lists ${BUILDER} in ${field}`);
  }
  for (const file of [...await files(join('packages', name, 'src')), ...await files(join('packages', name, 'dist'))]) {
    if (pattern.test(await readFile(file, 'utf8'))) problems.push(`${file} references the private builder package`);
  }
}

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
} else {
  console.log(`${BUILDER} stays out of published packages.`);
}
