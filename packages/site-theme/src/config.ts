import { copyFileSync, createReadStream, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import type { DefaultTheme } from 'vitepress';
import { fetchStarCount, formatStarCount } from './stars';

export { analyticsHead } from './analytics';
export { head, transformHead } from './seo/head';
export { coreBudgetKB, coreVersion, mcpVersion, pageUrl, repoUrl, siteName, siteUrl } from './seo/site';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const types: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

export function sharedPublic(): Plugin {
  let ssr = false;
  return {
    name: 'formhaus-site-theme-public',
    configResolved(config) {
      ssr = Boolean(config.build.ssr);
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const file = join(publicDir, decodeURIComponent(request.url?.split('?')[0] ?? ''));
        if (!file.startsWith(publicDir) || !statSync(file, { throwIfNoEntry: false })?.isFile()) return next();
        response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
        createReadStream(file).pipe(response);
      });
    },
    generateBundle() {
      if (ssr) return;
      for (const file of files(publicDir)) {
        this.emitFile({ type: 'asset', fileName: relative(publicDir, file).split(sep).join('/'), source: readFileSync(file) });
      }
    },
  };
}

export function ownHashmap(assetsDir = 'assets'): Plugin {
  return {
    name: 'formhaus-site-theme-hashmap',
    transform(code, id) {
      if (!id.split('?')[0].endsWith('/vitepress/dist/client/app/router.js')) return;
      return code.replace("'hashmap.json'", JSON.stringify(`${assetsDir}/hashmap.json`));
    },
  };
}

export function copyHashmap({ outDir, assetsDir }: { outDir: string; assetsDir: string }) {
  copyFileSync(join(outDir, 'hashmap.json'), join(outDir, assetsDir, 'hashmap.json'));
}

export const sharedDedupe = ['@formhaus/core', 'vue', 'vitepress'];

export const sharedNav: DefaultTheme.NavItem[] = [
  { text: 'Guide', link: '/guide/' },
  { text: 'Templates', link: '/templates/', activeMatch: '^/templates/' },
  { text: 'Framework', link: '/', activeMatch: '^/$' },
  { text: 'Cloud', link: '/cloud', activeMatch: '^/cloud' },
  { text: 'API', link: '/api/definition' },
  { text: 'Builder', link: '/build' },
  { text: 'Playground', link: '/playground' },
];

export async function sharedThemeConfig() {
  const count = await fetchStarCount();
  return {
    logo: { light: '/brand/logo-full.svg', dark: '/brand/logo-full-dark.svg', alt: 'Formhaus' },
    siteTitle: false as const,
    nav: sharedNav,
    githubStars: count === null ? null : { count, label: formatStarCount(count) },
  };
}
export { promoHead } from './promo';
