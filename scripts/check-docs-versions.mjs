import { readFile } from 'node:fs/promises';

const PACKAGES = ['core', 'react', 'vue'];
const REGISTRY = 'https://registry.npmjs.org';

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/;
const parse = (version) => version.match(SEMVER).slice(1, 4).map(Number);
function compare(a, b) {
  const [left, right] = [parse(a), parse(b)];
  for (let index = 0; index < 3; index++) if (left[index] !== right[index]) return left[index] - right[index];
  return 0;
}

async function latest(name) {
  try {
    const response = await fetch(`${REGISTRY}/-/package/${name}/dist-tags`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()).latest;
  } catch (error) {
    console.warn(`Warning: could not read ${name} from npm (${error.message}). Checking against the workspace version only.`);
    return undefined;
  }
}

const packages = new Map();
for (const name of PACKAGES) {
  const id = `@formhaus/${name}`;
  const { version } = JSON.parse(await readFile(`packages/${name}/package.json`, 'utf8'));
  packages.set(id, { workspace: version, published: await latest(id) });
}

const pins = [];
const docs = JSON.parse(await readFile('docs/package.json', 'utf8'));
const lock = await readFile('docs/pnpm-lock.yaml', 'utf8');
const importer = lock.slice(lock.indexOf('importers:'), lock.indexOf('\npackages:'));
for (const [name, range] of Object.entries(docs.devDependencies ?? {})) {
  if (!packages.has(name)) continue;
  pins.push({ where: 'docs/package.json', name, version: range.replace(/^[\^~]/, ''), raw: range });
  const locked = importer.match(new RegExp(`'${name}':\\n\\s+specifier: [^\\n]+\\n\\s+version: ([^(\\s]+)`))?.[1];
  pins.push({ where: 'docs/pnpm-lock.yaml', name, version: locked });
}

const problems = [];
const stale = [];
for (const { where, name, version, raw = version } of pins) {
  const { workspace, published } = packages.get(name);
  if (!SEMVER.test(version ?? '')) problems.push(`${where}: ${name} has no exact version or ^/~ range (${raw})`);
  else if (compare(version, workspace) > 0) problems.push(`${where}: ${name} ${version} is newer than the workspace ${workspace}`);
  else if (published && SEMVER.test(published) && compare(version, published) < 0)
    stale.push(`${where}: ${name} ${version} is older than ${published} on npm`);
}

if (stale.length) console.warn(`Warning: bump the docs pins after the release:\n${stale.map((line) => `  ${line}`).join('\n')}`);
if (problems.length) {
  console.error(`Docs pins are invalid:\n${problems.map((problem) => `  ${problem}`).join('\n')}`);
  process.exit(1);
}
console.log(`Checked ${pins.length} docs pins.`);
