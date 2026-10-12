import type { HeadConfig, TransformContext } from 'vitepress'
import { articleJsonLd, faqJsonLd, homeJsonLd } from './jsonld'
import { pageUrl, siteName, siteUrl } from './site'

export const head: HeadConfig[] = [
  ['link', { rel: 'icon', href: '/favicon.ico', sizes: '32x32' }],
  ['link', { rel: 'icon', type: 'image/svg+xml', href: '/brand/mark.svg' }],
  ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
  ['link', { rel: 'manifest', href: '/site.webmanifest' }],
  ['meta', { name: 'theme-color', content: '#5502fb' }],
  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:site_name', content: siteName }],
  ['meta', { property: 'og:image', content: `${siteUrl}/og.jpg` }],
  ['meta', { property: 'og:image:width', content: '1200' }],
  ['meta', { property: 'og:image:height', content: '630' }],
  ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ['meta', { name: 'twitter:image', content: `${siteUrl}/og.jpg` }],
]

function jsonLd(data: object): HeadConfig {
  return ['script', { type: 'application/ld+json' }, JSON.stringify(data).replace(/</g, '\\u003c')]
}

function isArticle(relativePath: string): boolean {
  return ['guide/', 'api/', 'recipes/', 'compare/'].some((section) => relativePath.startsWith(section))
}

export function transformHead({ pageData, title, description, content }: TransformContext): HeadConfig[] {
  if (pageData.isNotFound) return []
  const { relativePath } = pageData
  const url = pageUrl(relativePath)
  const tags: HeadConfig[] = [
    ['link', { rel: 'canonical', href: url }],
    ['meta', { property: 'og:title', content: relativePath === 'index.md' ? title : pageData.title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: url }],
  ]
  if (relativePath === 'index.md') tags.push(jsonLd(homeJsonLd(description)))
  if (relativePath === 'cloud.md') tags.push(jsonLd(faqJsonLd(content)))
  if (isArticle(relativePath)) {
    tags.push(jsonLd(articleJsonLd(pageData.title, description, url, pageData.lastUpdated)))
  }
  return tags
}
