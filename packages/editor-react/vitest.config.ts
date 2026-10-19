import { basename } from 'node:path';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  optimizeDeps: {
    include: [
      '@codemirror/commands',
      '@codemirror/lang-json',
      '@codemirror/language',
      '@codemirror/lint',
      '@codemirror/state',
      '@codemirror/view',
      '@lezer/highlight',
      'react/jsx-dev-runtime',
      'react/jsx-runtime',
    ],
  },
  css: {
    modules: {
      generateScopedName: (name, file) => `fh_ed_${basename(file).replace(/\.module\.css.*$/, '')}_${name}`,
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/**/*.browser.test.tsx'],
          setupFiles: ['src/test/setup.ts'],
          css: { modules: { classNameStrategy: 'non-scoped' } },
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.tsx'],
          css: true,
          browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
        },
      },
    ],
  },
});
