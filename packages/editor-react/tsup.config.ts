import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { transform } from 'esbuild';
import { defineConfig, type Options } from 'tsup';

type Plugin = NonNullable<Options['esbuildPlugins']>[number];

const prefixed: Plugin = {
  name: 'fh-ed-css-modules',
  setup(build) {
    build.onResolve({ filter: /\.module\.css$/ }, ({ path, resolveDir }) => {
      const file = join(resolveDir, path);
      return { path: join(dirname(file), `fh-ed-${basename(file, '.module.css')}`), namespace: 'fh-ed-css' };
    });
    build.onLoad({ filter: /.*/, namespace: 'fh-ed-css' }, async ({ path }) => {
      const file = join(dirname(path), `${basename(path).replace(/^fh-ed-/, '')}.module.css`);
      return { contents: await readFile(file, 'utf8'), loader: 'local-css', resolveDir: dirname(file) };
    });
  },
};

async function minifyMount() {
  const files = await readdir('dist');
  const chunks = files.filter((file) => file.endsWith('.css') && !['mount.css', 'style.css', 'index.css'].includes(file));
  const css = [await readFile('dist/mount.css', 'utf8'), ...(await Promise.all(chunks.map((file) => readFile(`dist/${file}`, 'utf8'))))];
  await writeFile('dist/mount.css', (await transform(css.join('\n'), { loader: 'css', minify: true })).code);
  await Promise.all(chunks.map((file) => rm(`dist/${file}`)));
  for (const file of files.filter((name) => name.endsWith('.js') && name !== 'index.js')) {
    const code = await readFile(`dist/${file}`, 'utf8');
    await writeFile(`dist/${file}`, (await transform(code, { loader: 'js', minify: true, target: 'es2022' })).code);
  }
}

const shared = {
  format: ['esm' as const],
  esbuildPlugins: [prefixed],
  target: 'es2022',
};

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    dts: true,
    clean: true,
    onSuccess: () => rename('dist/index.css', 'dist/style.css'),
  },
  {
    ...shared,
    entry: { mount: 'src/mount.tsx' },
    dts: true,
    splitting: true,
    noExternal: [/.*/],
    env: { NODE_ENV: 'production' },
    onSuccess: minifyMount,
  },
]);
