import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Formhaus',
  description: 'Framework-agnostic JSON-schema-driven form ecosystem',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/schema' },
      { text: 'Playground', link: '/playground' },
      { text: 'GitHub', link: 'https://github.com/ignsm/formhaus' }
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/' },
          { text: 'Field Types', link: '/guide/fields' },
          { text: 'Conditional Fields', link: '/guide/conditions' },
          { text: 'Validation', link: '/guide/validation' },
          { text: 'Multi-Step Forms', link: '/guide/steps' },
          { text: 'Error Handling', link: '/guide/errors' },
          { text: 'Custom Actions & Progress', link: '/guide/custom-components' },
          { text: 'Examples', link: '/guide/examples' },
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Schema', link: '/api/schema' },
        ]
      },
      {
        text: 'Figma Plugin',
        items: [
          { text: 'Plugin Guide', link: '/guide/figma' },
        ]
      },
      {
        text: 'Claude Skills',
        items: [
          { text: '/figma-connect', link: '/guide/figma-connect-skill' },
          { text: '/form-schema', link: '/guide/form-schema-skill' },
        ]
      },
      {
        text: 'Interactive',
        items: [
          { text: 'Playground', link: '/playground' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ignsm/formhaus' }
    ]
  }
})
