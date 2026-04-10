import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Formhaus',
  description: 'Framework-agnostic form engine with its own compact definition format',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/definition' },
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
          { text: 'Async Step Validation', link: '/guide/async-validation' },
          { text: 'Error Handling', link: '/guide/errors' },
          { text: 'Custom Actions & Progress', link: '/guide/custom-components' },
          { text: 'Examples', link: '/guide/examples' },
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Definition', link: '/api/definition' },
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
          { text: '/formhaus-figma-connect', link: '/guide/formhaus-figma-connect' },
          { text: '/formhaus-create-form', link: '/guide/formhaus-create-form' },
        ]
      },
      {
        text: 'Interactive',
        items: [
          { text: 'Playground', link: '/playground' },
        ]
      },
      {
        text: 'Meta',
        items: [
          { text: 'Changelog', link: '/changelog' },
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ignsm/formhaus' }
    ]
  }
})
