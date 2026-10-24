import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import type { Plugin } from 'vite';

const names = ['base', 'zod', 'valibot', 'arktype'];
const id = 'virtual:schema-runtimes';
const prefix = '/@schema-runtime/';
const cache = new Map<string, Promise<string>>();

function bundle(name: string) {
  if (!cache.has(name))
    cache.set(
      name,
      build({
        entryPoints: [fileURLToPath(new URL(`./components/schema-play/runtime/${name}.ts`, import.meta.url))],
        bundle: true,
        format: 'iife',
        minify: true,
        write: false,
        target: 'es2020',
        legalComments: 'none',
      }).then((result) => result.outputFiles[0]!.text),
    );
  return cache.get(name)!;
}

export function schemaRuntimes(): Plugin {
  let serve = false;
  return {
    name: 'formhaus-schema-runtimes',
    configResolved(config) {
      serve = config.command === 'serve';
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const name = req.url?.startsWith(prefix) ? req.url.slice(prefix.length, -'.js'.length) : '';
        if (!names.includes(name)) return next();
        res.setHeader('Content-Type', 'text/javascript');
        res.end(await bundle(name));
      });
    },
    resolveId: (source) => (source === id ? `\0${id}` : undefined),
    async load(resolved) {
      if (resolved !== `\0${id}`) return;
      if (serve) return `export default ${JSON.stringify(Object.fromEntries(names.map((name) => [name, `${prefix}${name}.js`])))};`;
      const refs = await Promise.all(
        names.map(async (name) => [name, this.emitFile({ type: 'asset', name: `schema-${name}.js`, source: await bundle(name) })]),
      );
      return `export default {${refs.map(([name, ref]) => `${JSON.stringify(name)}: import.meta.ROLLUP_FILE_URL_${ref}`).join(', ')}};`;
    },
  };
}
