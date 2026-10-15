import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ownerOf } from './routes.js';

const siteUrl = 'https://formhaus.dev';
const owners = ['docs', 'marketing'];
const xmlHead = '<?xml version="1.0" encoding="UTF-8"?>';

const locOf = (url) => new URL(url, `${siteUrl}/`).href;

function urlEntry({ url, lastmod }) {
  const date = lastmod ? `<lastmod>${new Date(lastmod).toISOString()}</lastmod>` : '';
  return `<url><loc>${locOf(url)}</loc>${date}</url>`;
}

export function sitemapCollector() {
  let collected = [];
  return {
    transformItems(items) {
      collected = items;
      return items;
    },
    items: () => collected,
  };
}

function lastCommit(file) {
  const stamp = execFileSync('git', ['log', '-1', '--format=%ct', '--', file], { encoding: 'utf8' }).trim();
  return stamp ? Number(stamp) * 1000 : undefined;
}

export function pageItems({ pages, srcDir }) {
  return pages.map((page) => ({
    url: page.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, ''),
    lastmod: lastCommit(join(srcDir, page)),
  }));
}

export function writeOwnSitemap(outDir, owner, items) {
  const own = items.filter(({ url }) => ownerOf(new URL(locOf(url)).pathname) === owner);
  const body = own.map(urlEntry).join('');
  writeFileSync(
    join(outDir, `sitemap-${owner}.xml`),
    `${xmlHead}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`,
  );
}

export function writeSitemapIndex(outDir) {
  const entries = owners.map((owner) => `<sitemap><loc>${siteUrl}/sitemap-${owner}.xml</loc></sitemap>`).join('');
  writeFileSync(
    join(outDir, 'sitemap.xml'),
    `${xmlHead}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</sitemapindex>`,
  );
}
