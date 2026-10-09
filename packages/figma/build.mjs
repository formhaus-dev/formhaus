import { watch } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, context } from 'esbuild';

const root = dirname(fileURLToPath(import.meta.url));
const dist = join(root, 'dist');
const uiRoot = join(root, 'src/ui');
const codeOptions = {
  bundle: true,
  entryPoints: [join(root, 'src/code.ts')],
  format: 'iife',
  outfile: join(dist, 'code.js'),
  target: 'es2017',
};

async function buildUi() {
  const sheets = (await readdir(uiRoot)).filter((file) => file.endsWith('.css')).sort();
  const [template, styles, script] = await Promise.all([
    readFile(join(uiRoot, 'index.html'), 'utf8'),
    Promise.all(sheets.map((file) => readFile(join(uiRoot, file), 'utf8'))).then((parts) => parts.join('\n')),
    build({ bundle: true, entryPoints: [join(uiRoot, 'main.ts')], format: 'iife', target: 'es2017', write: false }),
  ]);
  const code = script.outputFiles[0].text;
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
  watch(uiRoot, () => buildUi().catch(console.error));
}

async function runHarnessBuild() {
  await mkdir(dist, { recursive: true });
  await build({ ...codeOptions, entryPoints: [join(root, 'src/harness.ts')], outfile: join(dist, 'harness.js'), minify: true });
}

if (process.argv.includes('--watch')) await runWatch();
else if (process.argv.includes('--harness')) await runHarnessBuild();
else await runBuild();
