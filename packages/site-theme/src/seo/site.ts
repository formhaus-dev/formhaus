import { readFileSync } from 'node:fs';

export const siteUrl = 'https://formhaus.dev';
export const siteName = 'Formhaus';
export const repoUrl = 'https://github.com/formhaus-dev/formhaus';
export const authorUrl = 'https://github.com/ignsm';

const packageVersion = (name: string): string =>
  JSON.parse(readFileSync(new URL(`../../../${name}/package.json`, import.meta.url), 'utf8')).version;

export const coreVersion = packageVersion('core');
export const mcpVersion = packageVersion('mcp');

export function pageUrl(relativePath: string): string {
  const path = relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
  return `${siteUrl}/${path}`;
}
