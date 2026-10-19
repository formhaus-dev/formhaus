export const footerRepo = 'https://github.com/formhaus-dev/formhaus';

export interface FooterLink {
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
      { text: 'Cloud', href: '/' },
      { text: 'Pricing', href: '/#pricing' },
      { text: 'Templates', href: '/templates/' },
      { text: 'Examples', href: '/guide/examples' },
    ],
  },
  {
    id: 'developers',
    title: 'Developers',
    links: [
      { text: 'Docs', href: '/guide/' },
      { text: 'Form builder', href: '/build' },
      { text: 'Playground', href: '/playground' },
      { text: 'API reference', href: '/api/definition' },
      { text: 'MCP server', href: '/guide/mcp' },
      { text: 'Changelog', href: '/changelog' },
      { text: 'GitHub', href: footerRepo, dest: 'github' },
      { text: 'npm', href: 'https://www.npmjs.com/package/@formhaus/core', dest: 'npm' },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    links: [
      { text: 'Legal', href: '/legal/' },
      { text: 'Privacy', href: '/legal/privacy' },
      { text: 'Terms', href: '/legal/terms' },
      { text: 'Contact', href: 'mailto:hello@formhaus.dev' },
    ],
  },
];
