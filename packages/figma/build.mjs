import { watch } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, context, transform } from 'esbuild';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const codeOptions = {
  bundle: true,
  entryPoints: [join(root, 'src/code.ts')],
  format: 'iife',
  outfile: join(dist, 'code.js'),
  target: 'es2017',
};

async function buildUi() {
  const [template, styles, source] = await Promise.all([
    readFile(join(root, 'src/ui.html'), 'utf8'),
    readFile(join(root, 'src/ui.css'), 'utf8'),
    readFile(join(root, 'src/ui.ts'), 'utf8'),
  ]);
  const { code } = await transform(source, {
    format: 'iife',
    loader: 'ts',
    target: 'es2017',
  });
  const html = template
    .replace('/* FORMHAUS_STYLES */', styles)
    .replace('/* FORMHAUS_SCRIPT */', code);
  await mkdir(dist, { recursive: true });
  await writeFile(join(dist, 'ui.html'), html);
}

async function runBuild() {
  await mkdir(dist, { recursive: true });
  await Promise.all([build(codeOptions), buildUi()]);
}

async function runWatch() {
  await mkdir(dist, { recursive: true });
  const code = await context(codeOptions);
  await code.watch();
  await buildUi();
  for (const file of ['ui.html', 'ui.css', 'ui.ts']) {
    watch(join(root, 'src', file), () => buildUi().catch(console.error));
  }
}

if (process.argv.includes('--watch')) await runWatch();
else await runBuild();
