import { authorUrl, coreVersion, repoUrl, siteName, siteUrl } from './site'

const author = { '@type': 'Person', name: 'Ignat', url: authorUrl }

const keywords = [
  'form definition',
  'JSON forms',
  'form engine',
  'multi-step forms',
  'conditional fields',
  'form validation',
  'React forms',
  'Vue forms',
  'Figma plugin',
  'JSON Schema',
]

export function homeJsonLd(description: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareSourceCode',
        '@id': `${siteUrl}/#source`,
        name: siteName,
        description,
        url: `${siteUrl}/`,
        codeRepository: repoUrl,
        programmingLanguage: 'TypeScript',
        license: 'https://opensource.org/licenses/MIT',
        author,
        keywords: keywords.join(', '),
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${siteUrl}/#app`,
        name: siteName,
        description,
        url: `${siteUrl}/`,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        softwareVersion: coreVersion,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        author,
        sameAs: [
          repoUrl,
          'https://www.npmjs.com/package/@formhaus/core',
          'https://www.npmjs.com/package/@formhaus/react',
          'https://www.npmjs.com/package/@formhaus/vue',
          'https://www.npmjs.com/package/@formhaus/mcp',
        ],
      },
    ],
  }
}

export function articleJsonLd(headline: string, description: string, url: string, lastUpdated?: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    url,
    ...(lastUpdated ? { dateModified: new Date(lastUpdated).toISOString() } : {}),
    author,
    isPartOf: { '@type': 'WebSite', name: siteName, url: `${siteUrl}/` },
  }
}
