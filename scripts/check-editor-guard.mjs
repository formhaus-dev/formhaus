import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { alignment } from './editor-edges.mjs';
import { firstLine, layout } from './editor-layout.mjs';

const require = createRequire(new URL('../packages/editor-react/package.json', import.meta.url));
const { chromium } = require('playwright');

const port = process.env.EDITOR_GUARD_PORT ?? String(4900 + Math.floor(Math.random() * 600));
const base = `http://localhost:${port}`;
const shots = process.env.EDITOR_GUARD_SHOTS;
const template = JSON.parse(readFileSync(new URL('../templates/index.json', import.meta.url), 'utf8'))[0].slug;
const server = spawn('pnpm', ['--dir', 'docs', 'exec', 'vitepress', 'preview', '--port', port, '--strictPort'], { stdio: 'ignore' });

async function ready() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ok = await fetch(`${base}/build`).then((res) => res.ok, () => false);
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`docs preview never answered on ${base}`);
}

async function shoot(page, name, theme, width) {
  if (shots) await page.screenshot({ path: join(shots, `${name}-${theme}-${width}.png`) });
}

const blockSaves = (page, blocked) =>
  page.evaluate((on) => {
    const original = window.__fhSetItem ?? Storage.prototype.setItem;
    window.__fhSetItem = original;
    Storage.prototype.setItem = on
      ? function (key, value) {
          if (key === 'fh:build:v1') throw new DOMException('full', 'QuotaExceededError');
          return original.call(this, key, value);
        }
      : original;
  }, blocked);

const savedLabel = (page, text) =>
  page.waitForFunction((label) => (localStorage.getItem('fh:build:v1') ?? '').includes(`"label":"${label}"`), text, { timeout: 10000 });

async function editLabel(page, text) {
  const label = page.getByRole('textbox', { name: 'Field label' }).first();
  await label.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type(text);
}

async function leaveGuard(context, theme, width) {
  const page = await context.newPage();
  await page.goto(`${base}/build`);
  await editLabel(page, 'Saved email');
  await savedLabel(page, 'Saved email');
  await page.getByRole('link', { name: 'React' }).first().click();
  await page.waitForURL(/\/guide\//);
  if (await page.getByRole('dialog').count()) throw new Error('the leave dialog showed although everything was saved');
  await page.goto(`${base}/build`);
  await blockSaves(page, true);
  await editLabel(page, 'Unsaved email');
  await page.getByRole('button', { name: 'Retry' }).waitFor({ timeout: 10000 });
  await page.keyboard.press('Escape');
  await page.mouse.click(1, 1);
  await shoot(page, 'status-error', theme, width);
  await page.getByRole('link', { name: 'React' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Leave without saving?' });
  await dialog.waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  await shoot(page, 'leave-dialog', theme, width);
  await dialog.getByRole('button', { name: 'Cancel' }).click();
  await page.waitForTimeout(200);
  if (!page.url().endsWith('/build')) throw new Error('Cancel did not keep the user on /build');
  await blockSaves(page, false);
  await page.getByRole('button', { name: 'Retry' }).click();
  await savedLabel(page, 'Unsaved email');
  await page.getByRole('link', { name: 'React' }).first().click();
  await page.waitForURL(/\/guide\//);
  if (await page.getByRole('dialog').count()) throw new Error('the leave dialog showed after the retry saved');
  await page.close();
}

async function carryOver(context, theme, width) {
  const page = await context.newPage();
  await page.goto(`${base}/build`);
  await editLabel(page, 'Builder email');
  await savedLabel(page, 'Builder email');
  if (width < 768) {
    const demo = JSON.parse(await page.evaluate(() => localStorage.getItem('fh:build:v1'))).definition;
    demo.fields[0].label = 'Demo email';
    await page.evaluate((definition) => sessionStorage.setItem('fh:build:carry', JSON.stringify(definition)), demo);
    await page.goto(`${base}/build`);
  } else {
    await page.goto(`${base}/`);
    await page.locator('#demo-title').scrollIntoViewIfNeeded();
    const label = page.locator('#sandbox-write').getByRole('textbox', { name: 'Field label' }).first();
    await label.waitFor({ timeout: 15000 });
    await label.click();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Demo email');
    await page.getByRole('link', { name: 'open the free builder' }).click();
  }
  await page.waitForURL(/\/build$/);
  const offer = page.getByText(/^Restore unsaved changes from .+\?$/);
  await offer.waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  await shoot(page, 'restore-notice', theme, width);
  await page.getByRole('button', { name: 'Restore' }).click();
  await page.waitForTimeout(300);
  const restored = await page.getByRole('textbox', { name: 'Field label' }).evaluateAll((nodes) => nodes.map((node) => node.value));
  if (!restored.includes('Demo email')) throw new Error(`Restore did not load the landing demo, labels are ${restored.join(', ')}`);
  await savedLabel(page, 'Demo email');
  await page.reload();
  await page.getByRole('textbox', { name: 'Field label' }).first().waitFor();
  if (await offer.count()) throw new Error('the restore offer came back after the restored form was saved');
  if (width >= 768) await explicitStart(page);
  await page.close();
}

async function explicitStart(page) {
  await page.goto(`${base}/`);
  await page.locator('#demo-title').scrollIntoViewIfNeeded();
  const label = page.locator('#sandbox-write').getByRole('textbox', { name: 'Field label' }).first();
  await label.waitFor({ timeout: 15000 });
  await label.click();
  await page.keyboard.type(' again');
  await page.evaluate(() => {
    const link = Object.assign(document.createElement('a'), { href: '/build?new', textContent: 'blank' });
    link.id = 'fh-blank-start';
    window.__fhSpa = true;
    document.querySelector('#demo-title')?.after(link);
  });
  await page.locator('#fh-blank-start').click();
  await page.waitForURL(/\/build/);
  if (!(await page.evaluate(() => window.__fhSpa))) throw new Error('the blank start link did a full page load');
  await page.getByRole('heading', { name: 'Replace your current draft?' }).waitFor({ timeout: 10000 });
  await page.getByRole('button', { name: 'Replace draft' }).click();
  await page.getByRole('button', { name: 'Add field' }).first().waitFor();
  if (await page.getByText(/^Restore unsaved changes/).count()) throw new Error('an explicit blank start also showed the restore offer');
}


async function startDropsOffers(context) {
  const page = await context.newPage();
  await page.goto(`${base}/build`);
  for (const choice of ['Replace draft', 'Keep my draft']) {
    await page.evaluate(() => {
      const definition = { id: 'mine', title: 'Mine', submit: { label: 'Send' }, fields: [{ key: 'email', type: 'email', label: 'Mine email' }] };
      localStorage.setItem('fh:build:v1', JSON.stringify({ definition, revision: 3, savedAt: new Date().toISOString() }));
      const pending = { ...definition, fields: [{ key: 'email', type: 'email', label: 'Pending email' }] };
      localStorage.setItem('fh:build:v1:backup', JSON.stringify({ definition: pending, revision: 3, at: new Date().toISOString(), version: null, draft: null }));
      sessionStorage.setItem('fh:build:carry', JSON.stringify({ ...definition, title: 'Carried' }));
    });
    await page.goto(`${base}/build?template=${template}`);
    await page.getByRole('heading', { name: 'Replace your current draft?' }).waitFor({ timeout: 10000 });
    await page.getByRole('button', { name: choice }).click();
    await page.getByRole('textbox', { name: 'Field label' }).first().waitFor();
    await page.waitForTimeout(300);
    if (await page.getByText(/^Restore unsaved changes/).count()) throw new Error(`"${choice}" after ?template= still showed the restore offer`);
    const labels = await page.getByRole('textbox', { name: 'Field label' }).evaluateAll((nodes) => nodes.map((node) => node.value));
    if (labels.includes('Pending email')) throw new Error(`"${choice}" loaded the pending copy`);
  }
  await page.close();
}

async function check() {
  await ready();
  const browser = await chromium.launch();
  try {
    const sizes = [1440, 390];
    const themes = ['light', 'dark'];
    for (const width of sizes) {
      for (const theme of themes) {
        const context = await browser.newContext({ viewport: { width, height: width > 500 ? 900 : 844 }, colorScheme: theme });
        await context.addInitScript((mode) => localStorage.setItem('vitepress-theme-appearance', mode), theme);
        const page = await context.newPage();
        await alignment(page, base, `${theme} ${String(width)}`);
        await layout(page, base, `${theme} ${String(width)}`);
        await firstLine(page, base, `${theme} ${String(width)}`);
        await page.close();
        await leaveGuard(context, theme, width);
        await carryOver(context, theme, width);
        if (width === 1440 && theme === 'light') await startDropsOffers(context);
        await context.close();
      }
    }
    console.log('/build asks before leaving only with unsaved changes; the landing demo carries over to /build.');
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
