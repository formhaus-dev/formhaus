import type { PageData } from 'vitepress'

export function transformPageData(pageData: PageData) {
  const params = pageData.params
  if (!pageData.relativePath.startsWith('templates/') || !params?.slug) return
  pageData.title = `${params.title} template`
  pageData.description = `${params.summary} Free form template with a live preview and JSON definition.`
}
