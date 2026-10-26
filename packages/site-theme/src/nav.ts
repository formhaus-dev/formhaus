interface NavLink {
  label: string;
  href: string;
  description: string;
}

export interface NavGroup {
  id: string;
  label: string;
  links: NavLink[];
}

export const navGroups: NavGroup[] = [
  {
    id: 'framework',
    label: 'Framework',
    links: [
      { label: 'Overview', href: '/', description: 'Free, open-source form framework' },
      { label: 'Web', href: '/web', description: 'React, Vue and headless' },
      { label: 'SwiftUI', href: '/swift', description: 'iOS and macOS' },
      { label: 'Kotlin & Compose', href: '/kotlin', description: 'Android and JVM' },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud',
    links: [
      { label: 'Overview', href: '/cloud', description: 'An optional backend for your forms' },
      { label: 'Connect your form', href: '/cloud/submissions', description: 'Responses, embeds and your own UI' },
      { label: 'Pricing', href: '/cloud#pricing', description: 'Plans, limits and what is included' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    links: [
      { label: 'Form Builder', href: '/build', description: 'Create and export a definition' },
      { label: 'Templates', href: '/templates/', description: 'Ready-made forms to start from' },
      { label: 'Figma plugin', href: '/guide/figma', description: 'Design forms and explore their flow' },
      { label: 'AI agents & MCP', href: '/guide/mcp', description: 'Generate, validate and test forms' },
    ],
  },
];

export const navLinks = [
  { label: 'Playground', href: '/playground', match: /^\/play/ },
  { label: 'Docs', href: '/guide/', match: /^\/(guide|api|recipes|compare|migrate|spec|changelog)(\/|$)/ },
];

export const cloudLogin = 'https://app.formhaus.dev/login';

export const searchIndexes = ['/guide/search-index.json', '/search-index.json'];
