import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../packages/editor-react/package.json', import.meta.url));
const { chromium } = require('playwright');

const port = process.env.BUILD_PAGE_PORT ?? String(4300 + Math.floor(Math.random() * 600));
const base = `http://localhost:${port}`;
const server = spawn('pnpm', ['--dir', 'docs', 'exec', 'vitepress', 'preview', '--port', port, '--strictPort'], { stdio: 'ignore' });

async function ready() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ok = await fetch(`${base}/build`).then((res) => res.ok, () => false);
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`docs preview never answered on ${base}`);
}

async function check() {
  await ready();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/build`);
    const label = page.getByRole('textbox', { name: 'Field label' }).first();
    await label.click();
    await page.keyboard.type('Work email');
    await page.getByText('Saved', { exact: false }).first().waitFor({ timeout: 10000 });
    await page.reload();
    await page.getByRole('textbox', { name: 'Field label' }).first().waitFor();
    const kept = await page.getByRole('textbox', { name: 'Field label' }).first().inputValue();
    if (kept !== 'Work email') throw new Error(`the draft did not survive a reload, the label is "${kept}"`);
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download JSON' }).click()]);
    const definition = JSON.parse(await readFile(await download.path(), 'utf8'));
    if (definition.fields?.[0]?.label !== 'Work email') throw new Error('the downloaded JSON does not contain the edited field');
    if (errors.length) throw new Error(`page errors: ${errors.join('; ')}`);
    console.log('/build keeps the draft across a reload and downloads its JSON.');
  } finally {
    await browser.close();
  }
}

try {
  await check();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
}
