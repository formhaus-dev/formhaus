import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';
import { transformPageData } from './templates';
import { llms } from './llms';
import { templateFiles } from './template-files';
import {
  analyticsHead,
  copyHashmap,
  coreBudgetKB,
  head,
  ownHashmap,
  sharedDedupe,
  sharedPublic,
  sharedThemeConfig,
  siteUrl,
  transformHead,
} from '../../packages/site-theme/src/config';
import { ownerOf } from '../../packages/site-theme/src/routes.js';
import { sitemapCollector, writeOwnSitemap } from '../../packages/site-theme/src/sitemap.js';

const shared = await sharedThemeConfig();
const sitemap = sitemapCollector();

export default defineConfig({
  vite: {
    plugins: [llms, templateFiles(), sharedPublic(), ownHashmap()],
    resolve: {
      alias: {
        '@formhaus/site-theme': fileURLToPath(new URL('../../packages/site-theme/src/index.ts', import.meta.url)),
      },
      dedupe: sharedDedupe,
    },
    server: {
      fs: { allow: ['..'] },
    },
  },
  title: 'Formhaus',
  titleTemplate: ':title · Formhaus',
  description:
    'JSON form definition for React, Vue, Figma and AI agents: validation, conditional fields, multi-step forms and branching routes.',
  lastUpdated: true,
  markdown: {
    config: (md) => {
      const code = md.renderer.rules.code_inline!;
      md.renderer.rules.code_inline = (...args) => code(...args).replace('<code', '<code v-pre');
    },
  },
  cleanUrls: true,
  ignoreDeadLinks: [(url) => url.startsWith('/') && ownerOf(url.split(/[?#]/)[0]) === 'marketing'],
  sitemap: { hostname: siteUrl, transformItems: sitemap.transformItems },
  head: [...head, ...analyticsHead('docs')],
  transformHead,
  transformPageData,
  buildEnd: (config) => {
    copyHashmap(config);
    writeOwnSitemap(config.outDir, 'docs', sitemap.items());
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
          { text: 'Sections', link: '/guide/sections' },
          { text: 'Repeatable Groups', link: '/guide/groups' },
          { text: 'Validation', link: '/guide/validation' },
          { text: 'Multi-Step Forms', link: '/guide/steps' },
          { text: 'Async Step Validation', link: '/guide/async-validation' },
          { text: 'Server-side Validation', link: '/guide/server-validation' },
          { text: 'Error Handling', link: '/guide/errors' },
          { text: 'Testing', link: '/guide/testing' },
          { text: 'Translations', link: '/guide/translations' },
          { text: 'Server Rendering', link: '/guide/ssr' },
          { text: 'Research', link: '/guide/research' },
          { text: 'Custom Actions & Progress', link: '/guide/custom-components' },
          { text: 'Inline Edit Pattern', link: '/guide/inline-edit' },
          { text: 'Examples', link: '/guide/examples' },
          { text: 'Get an Endpoint', link: '/guide/endpoint' },
        ],
      },
      {
        text: 'Cloud',
        items: [{ text: 'Formhaus Cloud', link: '/cloud' }],
      },
      {
        text: 'Recipes',
        items: [
          { text: 'Overview', link: '/recipes/' },
          { text: 'Multi-step with branching', link: '/recipes/multi-step-branching' },
          { text: 'Flat API', link: '/recipes/flat-api' },
          { text: 'Conditional fields', link: '/recipes/conditional-fields' },
          { text: 'Derived values', link: '/recipes/derived-values' },
          { text: 'Nested sections', link: '/recipes/nested-sections' },
          { text: 'Quiz funnel', link: '/recipes/quiz-funnel' },
          { text: 'Question timing', link: '/recipes/question-timing' },
          { text: 'Steps in the URL', link: '/recipes/steps-in-url' },
          { text: 'Survey templates', link: '/recipes/survey-templates' },
          { text: 'Headless engine', link: '/recipes/headless-engine' },
          { text: 'Svelte 5', link: '/recipes/svelte' },
          { text: 'Figma to React', link: '/recipes/figma-to-react' },
          { text: 'AI agents', link: '/recipes/ai-agents' },
        ],
      },
      {
        text: 'Compare',
        items: [
          { text: 'Overview', link: '/compare/' },
          { text: 'vs react-hook-form', link: '/compare/react-hook-form' },
          { text: 'vs react-jsonschema-form', link: '/compare/react-jsonschema-form' },
          { text: 'vs JSON Forms', link: '/compare/json-forms' },
          { text: 'vs SurveyJS', link: '/compare/surveyjs' },
        ],
      },
      {
        text: 'Integrations',
        items: [
          { text: 'Next.js', link: '/guide/integrations/nextjs' },
          { text: 'Nuxt', link: '/guide/integrations/nuxt' },
          { text: 'shadcn/ui', link: '/guide/integrations/shadcn' },
          { text: 'Material UI', link: '/guide/integrations/mui' },
          { text: 'Vuetify', link: '/guide/integrations/vuetify' },
          { text: 'iOS and macOS', link: '/guide/ios' },
          { text: 'SwiftUI components', link: '/guide/integrations/swiftui' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Definition', link: '/api/definition' },
          { text: 'FormEngine', link: '/api/form-engine' },
        ],
      },
      {
        text: 'Specification',
        items: [{ text: 'Form definition 1.0', link: '/spec' }],
      },
      {
        text: 'Figma Plugin',
        items: [{ text: 'Plugin Guide', link: '/guide/figma' }],
      },
      {
        text: 'Claude Skills',
        items: [
          { text: '/formhaus:formhaus-figma-connect', link: '/guide/formhaus-figma-connect' },
          { text: '/formhaus:formhaus-create-form', link: '/guide/formhaus-create-form' },
        ],
      },
      {
        text: 'MCP Server',
        items: [{ text: 'Setup and Tools', link: '/guide/mcp' }],
      },
      {
        text: 'Interactive',
        items: [
          { text: 'Builder', link: '/build' },
          { text: 'Playground', link: '/playground' },
        ],
      },
      {
        text: 'Meta',
        items: [
          { text: 'What Formhaus covers', link: '/guide/scope' },
          { text: 'Stable API', link: '/guide/stability' },
          { text: 'Bundle size', link: '/guide/bundle-size' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
    ],
    ...{ coreBudgetKB },
  },
});
