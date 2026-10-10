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
          { text: 'Get an Endpoint', link: '/guide/endpoint' },
        ]
      },
      {
        text: 'Recipes',
        items: [
          { text: 'Overview', link: '/recipes/' },
          { text: 'Multi-step with branching', link: '/recipes/multi-step-branching' },
          { text: 'Conditional fields', link: '/recipes/conditional-fields' },
          { text: 'Quiz funnel', link: '/recipes/quiz-funnel' },
          { text: 'Headless engine', link: '/recipes/headless-engine' },
          { text: 'Figma to React', link: '/recipes/figma-to-react' },
          { text: 'AI agents', link: '/recipes/ai-agents' },
        ]
      },
      {
        text: 'Compare',
        items: [
          { text: 'Overview', link: '/compare/' },
          { text: 'vs react-hook-form', link: '/compare/react-hook-form' },
          { text: 'vs TanStack Form', link: '/compare/tanstack-form' },
          { text: 'vs react-jsonschema-form', link: '/compare/react-jsonschema-form' },
          { text: 'vs SurveyJS', link: '/compare/surveyjs' },
        ]
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Next.js', link: '/guide/integrations/nextjs' },
          { text: 'Nuxt', link: '/guide/integrations/nuxt' },
          { text: 'shadcn/ui', link: '/guide/integrations/shadcn' },
          { text: 'Material UI', link: '/guide/integrations/mui' },
          { text: 'Vuetify', link: '/guide/integrations/vuetify' },
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
        text: 'Specification',
        items: [
          { text: 'Form definition 1.0', link: '/spec' },
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
          { text: '/formhaus:formhaus-figma-connect', link: '/guide/formhaus-figma-connect' },
          { text: '/formhaus:formhaus-create-form', link: '/guide/formhaus-create-form' },
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
