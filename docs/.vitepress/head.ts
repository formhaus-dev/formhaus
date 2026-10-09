import type { HeadConfig, TransformContext } from 'vitepress'
import { articleJsonLd, homeJsonLd } from './jsonld'
import { pageUrl, siteName, siteUrl } from './site'

export const head: HeadConfig[] = [
  ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
  ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
  ['meta', { name: 'theme-color', content: '#5b3fb0' }],
  ['meta', { property: 'og:type', content: 'website' }],
  ['meta', { property: 'og:site_name', content: siteName }],
  ['meta', { property: 'og:image', content: `${siteUrl}/og.jpg` }],
  ['meta', { property: 'og:image:width', content: '1200' }],
  ['meta', { property: 'og:image:height', content: '630' }],
  ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ['meta', { name: 'twitter:image', content: `${siteUrl}/og.jpg` }],
]

function jsonLd(data: object): HeadConfig {
  return ['script', { type: 'application/ld+json' }, JSON.stringify(data)]
}

function isArticle(relativePath: string): boolean {
  return ['guide/', 'api/', 'recipes/'].some((section) => relativePath.startsWith(section))
}

export function transformHead({ pageData, title, description }: TransformContext): HeadConfig[] {
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
  if (isArticle(relativePath)) {
    tags.push(jsonLd(articleJsonLd(pageData.title, description, url, pageData.lastUpdated)))
  }
  return tags
}
