import { authorUrl, coreVersion, repoUrl, siteName, siteUrl } from './site';

const author = { '@type': 'Person', name: 'Ignat', url: authorUrl };

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
];

const plans = [
  { name: 'Free', price: '0' },
  { name: 'Pro', price: '19' },
  { name: 'Team', price: '49' },
];

export function homeJsonLd(description: string) {
  const organization = { '@id': `${siteUrl}/#organization` };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        ...organization,
        name: siteName,
        legalName: 'Fabrique-Futur LLC',
        url: `${siteUrl}/`,
        logo: `${siteUrl}/brand/icon-512.png`,
        sameAs: [repoUrl],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        name: siteName,
        url: `${siteUrl}/`,
        publisher: organization,
      },
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
        publisher: organization,
        offers: plans.map(({ name, price }) => ({
          '@type': 'Offer',
          name,
          price,
          priceCurrency: 'USD',
          url: `${siteUrl}/cloud/plans`,
          ...(price === '0'
            ? {}
            : {
                priceSpecification: { '@type': 'UnitPriceSpecification', price, priceCurrency: 'USD', unitText: 'MONTH' },
              }),
        })),
        sameAs: [
          repoUrl,
          'https://www.npmjs.com/package/@formhaus/core',
          'https://www.npmjs.com/package/@formhaus/react',
          'https://www.npmjs.com/package/@formhaus/vue',
          'https://www.npmjs.com/package/@formhaus/mcp',
        ],
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, url }, index) => ({ '@type': 'ListItem', position: index + 1, name, item: url })),
  };
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
  };
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

export function faqJsonLd(html: string) {
  const start = html.indexOf('id="faq"');
  const faq = start < 0 ? '' : html.slice(start).split('</section>')[0];
  const entries = [...faq.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*(?:<div\b[^>]*>\s*)*<p[^>]*>([\s\S]*?)<\/p>/g)];
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map(([, question, answer]) => ({
      '@type': 'Question',
      name: plainText(question.replace(/<a class="header-anchor"[\s\S]*?<\/a>/, '')),
      acceptedAnswer: { '@type': 'Answer', text: plainText(answer) },
    })),
  };
}
