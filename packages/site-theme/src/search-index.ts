import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Plugin } from 'vite';

export interface SearchEntry {
  id: string;
  url: string;
  title: string;
  section: string;
  text: string;
}

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'public') return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith('.md') ? [path] : [];
  });
}

function plain(markdown: string): string {
  return markdown
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\{#[^}]*\}/g, ' ')
    .replace(/[`*_>|#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(heading: string): string {
  return heading
    .normalize('NFKD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

function urlOf(file: string, root: string): string {
  const path = relative(root, file).split(sep).join('/').replace(/\.md$/, '');
  if (path === 'index') return '/';
  return path.endsWith('/index') ? `/${path.slice(0, -'index'.length)}` : `/${path}`;
}

function skipped(frontmatter: string): boolean {
  return /^search:\s*false\s*$/m.test(frontmatter) || /^layout:\s*["']?(false|page|home)["']?\s*$/m.test(frontmatter);
}

function buildSearchIndex(root: string): SearchEntry[] {
  return markdownFiles(root).flatMap((file) => {
    const source = readFileSync(file, 'utf8');
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(source);
    if (frontmatter && skipped(frontmatter[1])) return [];
    const body = (frontmatter ? source.slice(frontmatter[0].length) : source)
      .replace(/^(`{3,}|~{3,})[\s\S]*?^\1\s*$/gm, ' ')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ');
    const title = /^title:\s*["']?(.+?)["']?\s*$/m.exec(frontmatter?.[1] ?? '')?.[1] ?? /^#\s+(.+)$/m.exec(body)?.[1] ?? '';
    if (!title) return [];
    const url = urlOf(file, root);
    const parts = body.split(/^#{2,3}\s+(.+)$/m);
    const entries: SearchEntry[] = [{ id: url, url, title, section: '', text: plain(parts[0]).slice(0, 400) }];
    const used = new Map<string, number>();
    for (let index = 1; index < parts.length; index += 2) {
      const raw = parts[index].replace(/\s*\{#([^}]+)\}\s*$/, '');
      const explicit = /\{#([^}]+)\}\s*$/.exec(parts[index])?.[1];
      const base = explicit ?? slug(plain(raw.replace(/<[^>]+>/g, '')));
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      const anchor = count ? `${base}-${count}` : base;
      entries.push({
        id: `${url}#${anchor}`,
        url: `${url}#${anchor}`,
        title,
        section: plain(raw),
        text: plain(parts[index + 1] ?? '').slice(0, 400),
      });
    }
    return entries;
  });
}

export function searchIndex(root: string, fileName: string): Plugin {
  let ssr = false;
  return {
    name: 'formhaus-site-theme-search-index',
    configResolved(config) {
      ssr = Boolean(config.build.ssr);
    },
    configureServer(server) {
      server.middlewares.use(`/${fileName}`, (_request, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(buildSearchIndex(root)));
      });
    },
    generateBundle() {
      if (ssr) return;
      this.emitFile({ type: 'asset', fileName, source: JSON.stringify(buildSearchIndex(root)) });
    },
  };
}
