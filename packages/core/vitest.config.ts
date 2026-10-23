import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));

export default defineConfig({
  define: { __FORMHAUS_CORE_VERSION__: JSON.stringify(version) },
  resolve: {
    alias: [
      { find: /^@formhaus\/core\/(schema|i18n|fields)$/, replacement: fileURLToPath(new URL('./src/$1/index.ts', import.meta.url)) },
      { find: /^@formhaus\/core\/locales\/(.+)$/, replacement: fileURLToPath(new URL('./locales/$1.json', import.meta.url)) },
    ],
    dedupe: ['zod', 'valibot', 'arktype'],
  },
});
