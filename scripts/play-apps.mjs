import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'docs/public/play/apps');
const apps = JSON.parse(readFileSync(join(root, 'docs/.vitepress/components/play/apps.json'), 'utf8'));
const vitepress = createRequire(join(root, 'docs/package.json')).resolve('vitepress');
const { createMarkdownRenderer } = await import(pathToFileURL(vitepress).href);

const args = process.argv.slice(2);
const local = args.includes('--local');
const only = args.filter((arg) => !arg.startsWith('--'));
const unknown = only.filter((id) => !apps.some((app) => app.id === id));
if (unknown.length) throw new Error(`unknown apps: ${unknown.join(', ')}`);

const skip = new Set(['node_modules', 'dist', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc', 'README.md', 'tsconfig.local.json']);
const langs = { '.tsx': 'tsx', '.ts': 'ts', '.vue': 'vue', '.css': 'css', '.scss': 'scss', '.json': 'json', '.html': 'html' };

function walk(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    if (skip.has(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path, base) : [relative(base, path)];
  });
}

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} ${commandArgs.join(' ')} failed in ${relative(root, cwd)}`);
}

const literal = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const entry = (target, condition) => (typeof target === 'string' ? target : (target[condition] ?? target.default));

function packages() {
  return ['core', 'react', 'vue'].map((name) => {
    const dir = join(root, 'packages', name);
    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    const exports = Object.entries(manifest.exports).map(([path, target]) => ({
      specifier: manifest.name + path.slice(1),
      code: join(dir, entry(target, 'default')),
      types: typeof target === 'string' ? undefined : target.types && join(dir, target.types),
    }));
    return { dir, exports };
  });
}

function aliases(list) {
  return list.flatMap(({ exports }) =>
    exports.map(({ specifier, code }) =>
      specifier.includes('*')
        ? { find: new RegExp(`^${literal(specifier).replace('\\*', '(.+)')}$`), replacement: code.replace('*', '$1') }
        : { find: new RegExp(`^${literal(specifier)}$`), replacement: code },
    ),
  );
}

function typecheck(dir, list) {
  const require = createRequire(join(dir, 'package.json'));
  const ts = require('typescript');
  const vue = existsIn(dir, 'node_modules/vue-tsc');
  const base = existsIn(dir, 'tsconfig.app.json') ? 'tsconfig.app.json' : 'tsconfig.json';
  const parsed = ts.getParsedCommandLineOfConfigFile(join(dir, base), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
  const own = parsed?.options.paths ?? {};
  const paths = { ...own };
  for (const { exports } of list) for (const { specifier, types } of exports) if (types) paths[specifier] = [types];
  if (list.length && existsIn(dir, 'node_modules/@types/react')) {
    paths.react = ['./node_modules/@types/react'];
    paths['react/*'] = ['./node_modules/@types/react/*'];
  }
  if (list.length && vue) paths.vue = ['./node_modules/vue'];
  const config = join(dir, 'tsconfig.local.json');
  writeFileSync(config, JSON.stringify({ extends: `./${base}`, compilerOptions: { noEmit: true, tsBuildInfoFile: null, paths } }));
  try {
    run(join(dir, 'node_modules/.bin', vue ? 'vue-tsc' : 'tsc'), ['-p', config], dir);
  } finally {
    rmSync(config, { force: true });
  }
}

function existsIn(dir, path) {
  try {
    statSync(join(dir, path));
    return true;
  } catch {
    return false;
  }
}

async function build(app, dir, target, list) {
  typecheck(dir, list);
  if (!local) {
    run(join(dir, 'node_modules/.bin/vite'), ['build', '--base', `/play/apps/${app.id}/`, '--outDir', target, '--emptyOutDir'], dir);
    return;
  }
  const vite = await import(pathToFileURL(join(dir, 'node_modules/vite/dist/node/index.js')).href);
  const cwd = process.cwd();
  process.chdir(dir);
  try {
    await vite.build({
      root: dir,
      base: `/play/apps/${app.id}/`,
      logLevel: 'warn',
      build: { outDir: target, emptyOutDir: true },
      resolve: { alias: aliases(list), dedupe: ['react', 'react-dom', 'vue'] },
    });
  } finally {
    process.chdir(cwd);
  }
}

if (local && !args.includes('--skip-packages'))
  run('pnpm', ['--filter', '@formhaus/core', '--filter', '@formhaus/react', '--filter', '@formhaus/vue', 'run', 'build'], root);
const list = local ? packages() : [];
const md = await createMarkdownRenderer(join(root, 'docs'), { theme: { light: 'github-light', dark: 'github-dark' } });

for (const app of apps.filter((entry) => !only.length || only.includes(entry.id))) {
  const dir = join(root, 'examples', app.dir);
  const target = join(out, app.id);
  const started = Date.now();
  if (args.includes('--install')) run('pnpm', ['install', '--frozen-lockfile'], dir);
  await build(app, dir, target, list);
  const page = join(target, 'index.html');
  writeFileSync(page, readFileSync(page, 'utf8').replace('<head>', '<head>\n    <meta name="robots" content="noindex" />'));
  const project = Object.fromEntries(walk(dir).map((path) => [path, readFileSync(join(dir, path), 'utf8')]));
  const files = app.show.map((path) => {
    if (!(path in project)) throw new Error(`${app.id}: ${path} is not in ${app.dir}`);
    const lang = langs[extname(path)];
    const html = md.render(`\`\`\`${lang}\n${project[path]}\`\`\``);
    return { path, lang, source: project[path], html: /<pre[\s\S]*<\/pre>/.exec(html)[0] };
  });
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'code.json'), JSON.stringify({ dir: app.dir, files, project }));
  console.log(`${app.id}: built in ${Date.now() - started} ms`);
}
