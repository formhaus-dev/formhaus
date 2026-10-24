import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';

const require = createRequire(new URL('../packages/editor-react/package.json', import.meta.url));
export const playwright = require('playwright');
export const apps = JSON.parse(readFileSync(new URL('../docs/.vitepress/components/play/apps.json', import.meta.url), 'utf8'));

const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer().once('error', reject);
    probe.listen(0, () => {
      const { port } = probe.address();
      probe.close(() => resolve(String(port)));
    });
  });

export async function previewServer() {
  const port = process.env.PLAY_CHECK_PORT ?? (await freePort());
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

const benign = ['Failed to load resource', 'ResizeObserver loop'];

export function watchErrors(page, report) {
  const relevant = (text) => !benign.some((start) => text.replace(/^Error: /, '').startsWith(start));
  page.on('pageerror', (error) => relevant(error.message) && report(String(error)));
  page.on('console', (message) => message.type() === 'error' && relevant(message.text()) && report(message.text()));
  page.on(
    'response',
    (response) => response.status() >= 400 && !response.url().endsWith('/s/script.js') && report(`${response.status()} ${response.url()}`),
  );
}
