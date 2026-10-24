import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../packages/editor-react/package.json', import.meta.url));
export const playwright = require('playwright');
export const apps = JSON.parse(readFileSync(new URL('../docs/.vitepress/components/play/apps.json', import.meta.url), 'utf8'));

export function previewServer() {
  const port = process.env.PLAY_CHECK_PORT ?? String(4900 + Math.floor(Math.random() * 600));
  const base = process.env.PLAY_CHECK_BASE ?? `http://localhost:${port}`;
  const server = process.env.PLAY_CHECK_BASE
    ? null
    : spawn('pnpm', ['--dir', 'docs', 'exec', 'vitepress', 'preview', '--port', port, '--strictPort'], { stdio: 'ignore' });

  async function ready() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (
        await fetch(`${base}/play`).then(
          (res) => res.ok,
          () => false,
        )
      )
        return;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`docs preview never answered on ${base}`);
  }

  return { base, ready, stop: () => server?.kill() };
}

export function watchErrors(page, report) {
  page.on('pageerror', (error) => report(String(error)));
  page.on(
    'console',
    (message) => message.type() === 'error' && !message.text().startsWith('Failed to load resource') && report(message.text()),
  );
  page.on(
    'response',
    (response) => response.status() >= 400 && !response.url().endsWith('/s/script.js') && report(`${response.status()} ${response.url()}`),
  );
}
