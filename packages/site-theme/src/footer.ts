import type { GatedLink } from './gated';

export const footerRepo = 'https://github.com/formhaus-dev/formhaus';

interface FooterLink extends GatedLink {
  text: string;
  href: string;
  dest?: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export const footerColumns: FooterColumn[] = [
  {
    id: 'product',
    title: 'Product',
    links: [
      { text: 'Templates', href: '/templates/' },
      { text: 'Examples', href: '/guide/examples' },
      { text: 'Form builder', href: '/build' },
      { text: 'Playground', href: '/playground' },
    ],
  },
  {
    id: 'developers',
    title: 'Developers',
    links: [
      { text: 'Docs', href: '/guide/' },
      { text: 'API reference', href: '/api/definition' },
      { text: 'MCP server', href: '/guide/mcp' },
      { text: 'GitHub', href: footerRepo, dest: 'github' },
      { text: 'npm', href: 'https://www.npmjs.com/package/@formhaus/core', dest: 'npm' },
    ],
  },
];
