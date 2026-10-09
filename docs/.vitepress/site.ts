import { readFileSync } from 'node:fs'

export const siteUrl = 'https://formhaus.dev'
export const siteName = 'Formhaus'
export const repoUrl = 'https://github.com/ignsm/formhaus'
export const authorUrl = 'https://github.com/ignsm'

export const coreVersion: string = JSON.parse(
  readFileSync(new URL('../../packages/core/package.json', import.meta.url), 'utf8')
).version

export function pageUrl(relativePath: string): string {
  const path = relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html')
  return `${siteUrl}/${path}`
}
