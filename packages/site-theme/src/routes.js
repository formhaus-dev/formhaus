export const docsSections = ['guide', 'api', 'spec', 'recipes', 'compare', 'migrate', 'changelog', 'templates', 'playground', 'schema', 'figma', 'assets']
export const docsSubtrees = ['cloud', 'og']
export const docsFiles = ['/llms.txt', '/llms-full.txt', '/hashmap.json', '/sitemap-docs.xml']
export const marketingFiles = ['/og/home.jpg', '/og/build.jpg', '/og/legal.jpg']

export function isDocsPath(path) {
  if (marketingFiles.includes(path)) return false
  if (docsFiles.includes(path) || path.endsWith('.md')) return true
  if (docsSubtrees.some((name) => path.startsWith(`/${name}/`))) return true
  return docsSections.some((name) => path === `/${name}` || path.startsWith(`/${name}/`))
}

export function ownerOf(path) {
  return isDocsPath(path) ? 'docs' : 'marketing'
}

export function caddyDocsPaths() {
  return [
    ...docsSections.flatMap((name) => [`/${name}`, `/${name}/*`]),
    ...docsSubtrees.map((name) => `/${name}/*`),
    ...docsFiles,
    '*.md',
  ]
}
