import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { ownerOf } from '../packages/site-theme/src/routes.js';

const { values: options } = parseArgs({
  options: {
    audit: { type: 'boolean', default: false },
    dist: { type: 'string', default: new URL('../docs/.vitepress/dist/', import.meta.url).pathname },
    sitemap: { type: 'string', default: 'sitemap.xml' },
    owner: { type: 'string' },
    assets: { type: 'string', multiple: true, default: [] },
  },
});
const dist = resolve(options.dist);
const assetRoots = [dist, ...options.assets.map((root) => resolve(root))];
const siteUrl = 'https://formhaus.dev';
const maxTitle = 60;
const minDescription = 120;
const maxDescription = 160;
const audit = options.audit;
const owned = (page) => !options.owner || ownerOf(page.path) === options.owner;
const assetExists = (path) => assetRoots.some((root) => existsSync(join(root, path)));

function htmlFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

function decode(text) {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return match ? decode(match[1]) : undefined;
}

function meta(head, key) {
  const tag = [...head.matchAll(/<meta\s[^>]*>/g)]
    .map(([value]) => value)
    .find((value) => attribute(value, 'name') === key || attribute(value, 'property') === key);
  return tag ? attribute(tag, 'content') : undefined;
}

function inspect(file) {
  const html = readFileSync(file, 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const body = html.slice(html.indexOf('<body'));
  const canonicalTag = head.match(/<link[^>]*rel="canonical"[^>]*>/)?.[0];
  const jsonLd = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(([, data]) => {
    const parsed = JSON.parse(data);
    return (parsed['@graph'] ?? [parsed]).map((item) => item['@type']);
  });
  const headings = [...body.matchAll(/<h([1-6])[\s>]/g)].map(([, level]) => Number(level));
  return {
    path:
      '/' +
      relative(dist, file)
        .replace(/\\/g, '/')
        .replace(/(^|\/)index\.html$/, '$1')
        .replace(/\.html$/, ''),
    title: decode(head.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
    description: meta(head, 'description'),
    canonical: canonicalTag ? attribute(canonicalTag, 'href') : undefined,
    robots: meta(head, 'robots'),
    ogType: meta(head, 'og:type'),
    ogTitle: meta(head, 'og:title'),
    ogImage: meta(head, 'og:image'),
    ogImageAlt: meta(head, 'og:image:alt'),
    twitterCard: meta(head, 'twitter:card'),
    twitterImage: meta(head, 'twitter:image'),
    jsonLd,
    headings,
    rawLessThan: [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].some(([, data]) => data.includes('<')),
  };
}

const pages = htmlFiles(dist)
  .filter((file) => !file.endsWith('/404.html'))
  .map(inspect)
  .filter(owned);
const indexable = pages.filter((page) => !page.robots?.includes('noindex'));
const errors = [];
const fail = (page, message) => errors.push(`${page.path}: ${message}`);

for (const page of indexable) {
  if (!page.title) fail(page, 'missing title');
  else if (page.title.length > maxTitle) fail(page, `title is ${page.title.length} chars: ${page.title}`);
  if (!page.description) fail(page, 'missing description');
  else if (page.description.length > maxDescription) fail(page, `description is ${page.description.length} chars`);
  else if (page.description.length < minDescription) fail(page, `description is ${page.description.length} chars, under ${minDescription}`);
  if (!page.canonical) fail(page, 'missing canonical');
  else if (page.canonical !== siteUrl + page.path) fail(page, `canonical ${page.canonical}`);
  if (!page.ogImage) fail(page, 'missing og:image');
  else if (!page.ogImage.startsWith(`${siteUrl}/`) || !assetExists(page.ogImage.slice(siteUrl.length)))
    fail(page, `og:image not found: ${page.ogImage}`);
  if (!page.ogImageAlt) fail(page, 'missing og:image:alt');
  if (page.twitterCard !== 'summary_large_image') fail(page, 'missing twitter:card');
  if (page.twitterImage !== page.ogImage) fail(page, 'twitter:image differs from og:image');
  if (page.ogType !== (['/', '/cloud'].includes(page.path) ? 'website' : 'article')) fail(page, `og:type ${page.ogType}`);
  const h1 = page.headings.filter((level) => level === 1).length;
  if (h1 !== 1) fail(page, `${h1} h1 elements`);
  page.headings.forEach((level, index) => {
    if (index > 0 && level > page.headings[index - 1] + 1) fail(page, `heading jumps from h${page.headings[index - 1]} to h${level}`);
  });
  if (page.rawLessThan) fail(page, 'unescaped < in JSON-LD');
}

for (const key of ['title', 'description']) {
  const seen = new Map();
  for (const page of indexable) {
    if (!page[key]) continue;
    if (seen.has(page[key])) fail(page, `duplicate ${key} with ${seen.get(page[key])}`);
    else seen.set(page[key], page.path);
  }
}

const sitemap = new Set([...readFileSync(join(dist, options.sitemap), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url));
for (const page of pages) {
  const listed = sitemap.has(siteUrl + page.path);
  const noindex = page.robots?.includes('noindex');
  if (noindex && listed) fail(page, 'noindex page listed in sitemap');
  if (!noindex && !listed) fail(page, 'indexable page missing from sitemap');
}

if (audit) {
  const columns = ['path', 'title', 'description', 'canonical', 'robots', 'ogType', 'ogTitle', 'ogImage', 'twitterCard', 'jsonLd'];
  console.log(columns.join('\t'));
  for (const page of pages.sort((a, b) => a.path.localeCompare(b.path))) {
    console.log(columns.map((column) => [page[column]].flat().join(',') || '-').join('\t'));
  }
}

console.log(`${pages.length} pages, ${indexable.length} indexable, ${errors.length} problems`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
