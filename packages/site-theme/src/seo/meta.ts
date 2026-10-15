import sections from './og-sections.json';
import { siteName, siteUrl } from './site';

type Section = keyof typeof sections;

const routes: [string, Section, string?, string?][] = [
  ['templates/', 'templates', 'Templates', '/templates/'],
  ['guide/', 'guide', 'Guide', '/guide/'],
  ['recipes/', 'recipes', 'Recipes', '/recipes/'],
  ['compare/', 'compare', 'Compare', '/compare/'],
  ['cloud/', 'cloud', 'Cloud', '/cloud'],
  ['legal/', 'legal', 'Legal', '/legal/'],
  ['cloud.md', 'cloud'],
  ['api/', 'api'],
  ['spec.md', 'api'],
  ['build.md', 'build'],
  ['playground.md', 'playground'],
];

const route = (relativePath: string) => routes.find(([prefix]) => relativePath.startsWith(prefix));

export interface OgImage {
  url: string;
  alt: string;
}

export function ogImage(relativePath: string, template?: { slug: string; title: string }): OgImage {
  if (template) {
    return {
      url: `${siteUrl}/og/templates/${template.slug}.jpg`,
      alt: `${template.title} template on Formhaus, with a preview of the form`,
    };
  }
  const name = route(relativePath)?.[1] ?? 'home';
  const section = sections[name];
  return {
    url: `${siteUrl}/og/${name}.jpg`,
    alt:
      name === 'home'
        ? `${siteName}: ${section.title}, next to a published contact form at its link`
        : `${siteName} ${section.eyebrow}: ${section.title}`,
  };
}

export function breadcrumbs(relativePath: string, title: string, url: string) {
  const match = route(relativePath);
  const items = [{ name: siteName, url: `${siteUrl}/` }];
  if (match?.[2] && match[3] && `${siteUrl}${match[3]}` !== url) items.push({ name: match[2], url: `${siteUrl}${match[3]}` });
  items.push({ name: title, url });
  return items;
}
