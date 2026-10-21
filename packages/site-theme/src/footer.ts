export const footerRepo = 'https://github.com/formhaus-dev/formhaus';

interface FooterLink {
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
      { text: 'Cloud', href: '/cloud' },
      { text: 'Pricing', href: '/cloud#pricing' },
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
  {
    id: 'company',
    title: 'Company',
    links: [
      { text: 'Changelog', href: '/changelog' },
      { text: 'Legal', href: '/legal/' },
      { text: 'Privacy', href: '/legal/privacy' },
      { text: 'Terms', href: '/legal/terms' },
      { text: 'Contact', href: 'mailto:hello@formhaus.dev' },
    ],
  },
];
