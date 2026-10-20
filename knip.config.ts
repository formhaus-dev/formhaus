import type { KnipConfig } from 'knip';

const scripts = (text: string) => [...text.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]).join('\n');

const pageScripts = (text: string) =>
  [...text.replace(/^(`{3,}|~{3,})[\s\S]*?^\1/gm, '').matchAll(/^<script[^>]*>([\s\S]*?)^<\/script>/gm)]
    .map((match) => match[1])
    .join('\n');

const sources = '**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx,vue,md}';

const config: KnipConfig = {
  compilers: { '.md': pageScripts, '.vue': scripts },
  ignoreFiles: ['packages/**/*.md'],
  ignoreIssues: {
    'docs/.vitepress/components/playground/loaders/*.ts': ['exports'],
    'packages/editor-react/src/store/store.ts': ['types'],
  },
  workspaces: {
    '.': {
      entry: ['scripts/*.{mjs,cjs}'],
      project: ['scripts/**'],
      ignoreDependencies: ['publint', '@arethetypeswrong/cli'],
      ignoreBinaries: ['tokens', 'vitepress'],
    },
    docs: {
      entry: ['**/*.md', 'templates/[[]slug].paths.ts', 'recipes/snippets/*.{ts,tsx,vue}'],
      project: [sources],
      ignoreDependencies: ['vue', 'vite', 'react', 'vue-router'],
    },
    'packages/*': {
      project: [sources],
      vitest: { entry: ['**/*.test.{ts,tsx}'] },
    },
    'packages/figma': {
      project: [sources],
      entry: ['src/code.ts', 'src/harness.ts', 'src/ui/main.ts'],
      vitest: { entry: ['src/**/*.test.ts'] },
      ignoreDependencies: ['@figma/plugin-typings'],
    },
    'packages/site-theme': {
      project: [sources],
      vitest: { entry: ['**/*.test.{ts,tsx}'] },
      ignoreDependencies: ['vue', 'vite', 'vitepress'],
    },
    'packages/vue': {
      project: [sources],
      entry: ['src/cloud/index.ts', 'src/i18n/index.ts'],
      vitest: { entry: ['**/*.test.{ts,tsx}'] },
      ignoreDependencies: ['@vue/language-core'],
    },
  },
};

export default config;
