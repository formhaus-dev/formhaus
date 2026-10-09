import { defineConfig } from 'vitepress'
import { head, transformHead } from './head'
import { llms } from './llms'
import { siteUrl } from './site'

export default defineConfig({
  vite: {
    plugins: [llms],
    server: {
      fs: { allow: ['..'] }
    }
  },
  title: 'Formhaus',
  titleTemplate: ':title · Formhaus',
  description: 'JSON form definition for React, Vue, Figma and AI agents: validation, conditional fields, multi-step forms and branching routes.',
  lastUpdated: true,
  sitemap: { hostname: siteUrl },
  head,
  transformHead,
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
          { text: 'Inline Edit Pattern', link: '/guide/inline-edit' },
          { text: 'Examples', link: '/guide/examples' },
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Definition', link: '/api/definition' },
          { text: 'FormEngine', link: '/api/form-engine' },
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
        text: 'MCP Server',
        items: [
          { text: 'Setup and Tools', link: '/guide/mcp' },
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
