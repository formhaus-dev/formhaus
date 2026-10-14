import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { transformPageData } from './templates'
import { llms } from './llms'
import { templateFiles } from './template-files'
import { analyticsHead, copyHashmap, coreBudgetKB, head, ownHashmap, sharedDedupe, sharedPublic, sharedThemeConfig, siteUrl, transformHead } from '../../packages/site-theme/src/config'
import { sitemapCollector, writeOwnSitemap } from '../../packages/site-theme/src/sitemap.js'

const shared = await sharedThemeConfig()
const sitemap = sitemapCollector()

export default defineConfig({
  vite: {
    plugins: [llms, templateFiles(), sharedPublic(), ownHashmap()],
    resolve: {
      alias: {
        '@formhaus/editor-react': fileURLToPath(new URL('../../packages/editor-react/dist', import.meta.url)),
        '@formhaus/site-theme': fileURLToPath(new URL('../../packages/site-theme/src/index.ts', import.meta.url))
      },
      dedupe: sharedDedupe
    },
    server: {
      fs: { allow: ['..'] }
    }
  },
  title: 'Formhaus',
  titleTemplate: ':title · Formhaus',
  description: 'JSON form definition for React, Vue, Figma and AI agents: validation, conditional fields, multi-step forms and branching routes.',
  lastUpdated: true,
  cleanUrls: true,
  ignoreDeadLinks: [/^\/legal\//],
  sitemap: { hostname: siteUrl, transformItems: sitemap.transformItems },
  head: [...head, ...analyticsHead('docs')],
  transformHead,
  transformPageData,
  buildEnd: (config) => {
    copyHashmap(config)
    writeOwnSitemap(config.outDir, 'docs', sitemap.items())
  },
  themeConfig: {
    ...shared,
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
          { text: 'Server-side Validation', link: '/guide/server-validation' },
          { text: 'Error Handling', link: '/guide/errors' },
          { text: 'Custom Actions & Progress', link: '/guide/custom-components' },
          { text: 'Inline Edit Pattern', link: '/guide/inline-edit' },
          { text: 'Examples', link: '/guide/examples' },
          { text: 'Get an Endpoint', link: '/guide/endpoint' },
          { text: 'Migrate to 0.11', link: '/migrate/0.11' },
        ]
      },
      {
        text: 'Cloud',
        items: [
          { text: 'Formhaus Cloud', link: '/cloud' },
          { text: 'Overview', link: '/cloud/overview' },
          { text: 'Quickstart', link: '/cloud/quickstart' },
          { text: 'Connect Claude', link: '/cloud/connect-claude' },
          { text: 'Publishing', link: '/cloud/publishing' },
          { text: 'Collecting submissions', link: '/cloud/submissions' },
          { text: 'Teams and roles', link: '/cloud/teams' },
          { text: 'Dashboard', link: '/cloud/dashboard' },
          { text: 'Webhooks', link: '/cloud/webhooks' },
          { text: 'Zapier and Make', link: '/cloud/zapier-make' },
          { text: 'Email notifications', link: '/cloud/emails' },
          { text: 'REST API', link: '/cloud/rest-api' },
          { text: 'MCP reference', link: '/cloud/mcp' },
          { text: 'Plans, limits and data', link: '/cloud/plans' },
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
          { text: 'Svelte 5', link: '/recipes/svelte' },
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
          { text: 'Builder', link: '/build' },
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
    ...{ coreBudgetKB }
  }
})
