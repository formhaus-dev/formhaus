import type { HeadConfig, TransformContext } from 'vitepress';
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, homeJsonLd } from './jsonld';
import { breadcrumbs, ogImage } from './meta';
import { pageUrl, siteName } from './site';

export const head: HeadConfig[] = [
  ['link', { rel: 'icon', href: '/favicon.ico', sizes: '32x32' }],
  ['link', { rel: 'icon', type: 'image/svg+xml', href: '/brand/mark.svg' }],
  ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
  ['link', { rel: 'manifest', href: '/site.webmanifest' }],
  ['meta', { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#ffffff' }],
  ['meta', { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#1b1b1f' }],
  ['meta', { property: 'og:site_name', content: siteName }],
  ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
];

function jsonLd(data: object): HeadConfig {
  return ['script', { type: 'application/ld+json' }, JSON.stringify(data).replace(/</g, '\\u003c')];
}

function isArticle(relativePath: string): boolean {
  return ['guide/', 'api/', 'recipes/', 'compare/', 'cloud/', 'spec.md'].some((section) => relativePath.startsWith(section));
}

export function transformHead({ pageData, title, description, content }: TransformContext): HeadConfig[] {
  if (pageData.isNotFound) return [];
  const { relativePath, params } = pageData;
  const home = relativePath === 'index.md';
  const cloud = relativePath === 'cloud.md';
  const url = pageUrl(relativePath);
  const image = ogImage(relativePath, params?.slug ? { slug: params.slug, title: params.title } : undefined);
  const tags: HeadConfig[] = [
    ['link', { rel: 'canonical', href: url }],
    ['meta', { property: 'og:type', content: home ? 'website' : 'article' }],
    ['meta', { property: 'og:title', content: home ? title : pageData.title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:image', content: image.url }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: image.alt }],
    ['meta', { name: 'twitter:image', content: image.url }],
    ['meta', { name: 'twitter:image:alt', content: image.alt }],
  ];
  if (home) tags.push(jsonLd(homeJsonLd(description)));
  else tags.push(jsonLd(breadcrumbJsonLd(breadcrumbs(relativePath, pageData.title, url))));
  if (cloud) tags.push(jsonLd(faqJsonLd(content)));
  if (isArticle(relativePath)) {
    tags.push(jsonLd(articleJsonLd(pageData.title, description, url, pageData.lastUpdated)));
  }
  return tags;
}
