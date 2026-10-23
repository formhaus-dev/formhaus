import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'docs/public/play/apps');
const vitepress = createRequire(join(root, 'docs/package.json')).resolve('vitepress');
const { createMarkdownRenderer } = await import(pathToFileURL(vitepress).href);

const apps = [
  { id: 'react', dir: 'react-default', show: ['src/App.tsx', 'src/main.tsx', 'src/styles.css'] },
  {
    id: 'shadcn',
    dir: 'react-shadcn',
    show: [
      'src/App.tsx',
      'src/component-map.ts',
      'src/FormActions.tsx',
      'src/StepProgress.tsx',
      'src/fields/TextField.tsx',
      'src/fields/SelectField.tsx',
    ],
  },
  {
    id: 'vuetify',
    dir: 'vue-vuetify',
    show: [
      'src/App.vue',
      'src/main.ts',
      'src/component-map.ts',
      'src/actions/FormActions.vue',
      'src/actions/StepProgress.vue',
      'src/fields/TextField.vue',
    ],
  },
];

const skip = new Set(['node_modules', 'dist', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc', 'README.md']);
const langs = { '.tsx': 'tsx', '.ts': 'ts', '.vue': 'vue', '.css': 'css', '.json': 'json', '.html': 'html' };

function walk(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    if (skip.has(name)) return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path, base) : [relative(base, path)];
  });
}

const md = await createMarkdownRenderer(join(root, 'docs'), { theme: { light: 'github-light', dark: 'github-dark' } });
const only = process.argv.slice(2);

for (const app of apps.filter((entry) => !only.length || only.includes(entry.id))) {
  const dir = join(root, 'examples', app.dir);
  const target = join(out, app.id);
  const started = Date.now();
  const build = spawnSync(
    join(dir, 'node_modules/.bin/vite'),
    ['build', '--base', `/play/apps/${app.id}/`, '--outDir', target, '--emptyOutDir'],
    {
      cwd: dir,
      stdio: 'inherit',
    },
  );
  if (build.status !== 0) process.exit(build.status ?? 1);
  const project = Object.fromEntries(walk(dir).map((path) => [path, readFileSync(join(dir, path), 'utf8')]));
  const files = app.show.map((path) => {
    const lang = langs[extname(path)];
    const html = md.render(`\`\`\`${lang}\n${project[path]}\`\`\``);
    return { path, lang, source: project[path], html: /<pre[\s\S]*<\/pre>/.exec(html)[0] };
  });
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'code.json'), JSON.stringify({ dir: app.dir, files, project }));
  console.log(`${app.id}: built in ${Date.now() - started} ms`);
}
