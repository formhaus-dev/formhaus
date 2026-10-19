import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
export const FLAGS = ['full', 'code', 'peers', 'deps', 'docs', 'templates', 'examples'];
const CONTENT = new Set(['docs', 'templates', 'examples']);
const PEERS = new Set(['core', 'react', 'vue']);
const SKIP = new Set(['node_modules', 'dist', 'coverage']);
const SOURCE = /\.(?:[cm]?[jt]sx?|vue)$/;
const TEST = /\.test\.tsx?$/;
const LITERAL = /['"`]([^'"`\n]+)['"`]/g;
const IMPORT = /from ['"](\.{1,2}\/[^'"]+)['"]/g;

const toRoot = (path) => relative(root, path).split(sep).join('/');
const top = (path) => path.split('/')[0];
const withoutExtension = (path) => path.replace(/\.[^./]+$/, '');

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || SKIP.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    return SOURCE.test(entry.name) ? [path] : [];
  });
}

function packageFiles() {
  return readdirSync(join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => walk(join(root, 'packages', entry.name)));
}

function contentRefs(file, { bare = true } = {}) {
  const packageRoot = join(root, ...toRoot(file).split('/').slice(0, 2));
  const refs = new Set();
  for (const [, literal] of readFileSync(file, 'utf8').matchAll(LITERAL)) {
    if (literal.includes('${')) continue;
    if (literal.startsWith('./') || literal.startsWith('../')) {
      for (const base of [dirname(file), packageRoot]) {
        const path = toRoot(resolve(base, literal));
        if (CONTENT.has(top(path)) && existsSync(join(root, path))) refs.add(path);
      }
    } else if (bare && /^(?:docs|templates|examples)(?:\/[\w./-]*)?$/.test(literal) && existsSync(join(root, literal))) {
      refs.add(literal.replace(/\/$/, ''));
    }
  }
  return [...refs];
}

const inTests = (file) => toRoot(file).split('/').includes('__tests__');

export function sourceRefs(files = packageFiles()) {
  return [
    ...new Set(files.filter((file) => !TEST.test(file) && !inTests(file)).flatMap((file) => contentRefs(file, { bare: false }))),
  ].sort();
}

export function contentTests(files = packageFiles()) {
  const helpers = new Set(
    files.filter((file) => !TEST.test(file) && inTests(file) && contentRefs(file).length).map((file) => withoutExtension(file)),
  );
  const imports = (file) =>
    [...readFileSync(file, 'utf8').matchAll(IMPORT)].some(([, path]) => helpers.has(withoutExtension(resolve(dirname(file), path))));
  return files
    .filter((file) => TEST.test(file) && (contentRefs(file).length || imports(file)))
    .map(toRoot)
    .sort();
}

const allFlags = (value) => Object.fromEntries(FLAGS.map((flag) => [flag, value]));

export function classify(files, refs = sourceRefs()) {
  const flags = allFlags(false);
  if (!files.length) flags.full = true;
  for (const file of files) {
    const [first, name] = file.split('/');
    if (refs.some((ref) => file === ref || file.startsWith(`${ref}/`))) flags.full = true;
    else if (first === 'packages' && name && file.split('/').length > 2) {
      flags.code = true;
      if (PEERS.has(name)) flags.peers = true;
      if (file === `packages/${name}/package.json`) flags.deps = true;
    } else if (CONTENT.has(first) && name) flags[first] = true;
    else flags.full = true;
  }
  return flags.full ? allFlags(true) : flags;
}

export function detect({ event, base, cwd = root }) {
  if (event !== 'pull_request') return allFlags(true);
  let files;
  try {
    files = execFileSync('git', ['diff', '--name-only', base, 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
      .split('\n')
      .filter(Boolean);
  } catch (error) {
    console.warn(`git diff against ${base} failed, running everything: ${error.message.trim()}`);
    return allFlags(true);
  }
  return classify(files);
}

function runContentTests() {
  const byPackage = new Map();
  for (const file of contentTests()) {
    const directory = file.split('/').slice(0, 2).join('/');
    byPackage.set(directory, [...(byPackage.get(directory) ?? []), file]);
  }
  let failed = false;
  for (const [directory, files] of byPackage) {
    const args = ['--dir', directory, 'test', ...files.map((file) => file.slice(directory.length + 1))];
    console.log(`pnpm ${args.join(' ')}`);
    if (spawnSync('pnpm', args, { cwd: root, stdio: 'inherit' }).status !== 0) failed = true;
  }
  if (failed) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [command, base = 'HEAD^1'] = process.argv.slice(2);
  if (command === 'changes') {
    const lines = Object.entries(detect({ event: process.env.GITHUB_EVENT_NAME, base })).map(([flag, value]) => `${flag}=${value}`);
    console.log(lines.join('\n'));
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
  } else if (command === 'content-tests') runContentTests();
  else if (command === 'list-content-tests') console.log(contentTests().join('\n'));
  else {
    console.error('Usage: node scripts/ci-affected.mjs changes [base] | content-tests | list-content-tests');
    process.exitCode = 1;
  }
}
