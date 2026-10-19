import { readdirSync, readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import aliases from './template-aliases.json';

const directory = new URL('../../templates/', import.meta.url);
const names = () => readdirSync(directory).filter((name) => name.endsWith('.json'));
const read = (name: string) => readFileSync(new URL(name, directory), 'utf8');
const siteUrl = 'https://formhaus.dev';
const stub = (target: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Template moved</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${siteUrl}/templates/${target}">
<meta http-equiv="refresh" content="0; url=/templates/${target}">
</head>
<body>
<p><a href="/templates/${target}">This template moved to ${target}.</a></p>
</body>
</html>
`;

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
        const alias = aliases[name.replace(/\.json$/, '') as keyof typeof aliases];
        const file = name.endsWith('.json') && alias ? `${alias}.json` : name;
        if (!names().includes(file)) return next();
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(read(file));
      });
    },
    generateBundle() {
      if (ssr) return;
      for (const name of names()) this.emitFile({ type: 'asset', fileName: `templates/${name}`, source: read(name) });
      for (const [from, to] of Object.entries(aliases)) {
        this.emitFile({ type: 'asset', fileName: `templates/${from}.json`, source: read(`${to}.json`) });
        this.emitFile({ type: 'asset', fileName: `templates/${from}.html`, source: stub(to) });
      }
    },
  };
}
