import { readdirSync, readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

const directory = new URL('../../templates/', import.meta.url);
const names = () => readdirSync(directory).filter((name) => name.endsWith('.json'));
const read = (name: string) => readFileSync(new URL(name, directory), 'utf8');

export function templateFiles(): Plugin {
  let ssr = false;
  return {
    name: 'formhaus-template-files',
    configResolved(config) {
      ssr = Boolean(config.build.ssr);
    },
    configureServer(server) {
      server.middlewares.use('/templates/', (request, response, next) => {
        const name = request.url?.split('?')[0]?.slice(1) ?? '';
        if (!names().includes(name)) return next();
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(read(name));
      });
    },
    generateBundle() {
      if (ssr) return;
      for (const name of names()) this.emitFile({ type: 'asset', fileName: `templates/${name}`, source: read(name) });
    },
  };
}
