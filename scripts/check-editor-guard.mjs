import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../packages/editor-react/package.json', import.meta.url));
const { chromium } = require('playwright');

const port = process.env.EDITOR_GUARD_PORT ?? String(4900 + Math.floor(Math.random() * 600));
const base = `http://localhost:${port}`;
const shots = process.env.EDITOR_GUARD_SHOTS;
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

async function alignment(page, theme, width) {
  await page.goto(`${base}/build`);
  await page.getByRole('textbox', { name: 'Field label' }).first().click();
  const found = await page.evaluate(() => {
    const rect = (node) => node?.getBoundingClientRect();
    const card = document.querySelector('[data-card]');
    const submit = [...document.querySelectorAll('label')].find((label) => label.textContent.trim() === 'Submit button');
    return {
      title: rect(document.querySelector('textarea[aria-label="Form title"]')?.parentElement),
      description: rect(document.querySelector('textarea[aria-label="Form description"]')?.parentElement),
      label: rect(document.querySelector('textarea[aria-label="Field label"]')?.parentElement),
      placeholder: rect(card?.querySelector('input[placeholder]')),
      submit: rect(submit && document.getElementById(submit.htmlFor)),
    };
  });
  const lefts = Object.entries(found).map(([name, box]) => [name, box?.left]);
  const rights = ['title', 'description', 'placeholder'].map((name) => [name, found[name]?.right]);
  for (const [edge, list] of [['left', lefts], ['right', rights]]) {
    const [, first] = list[0];
    const off = list.filter(([, value]) => value === undefined || Math.abs(value - first) > 0.5);
    if (off.length) throw new Error(`${theme} ${width}: ${edge} edges differ: ${JSON.stringify(list)}`);
  }
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
        await alignment(page, theme, width);
        await page.close();
        await leaveGuard(context, theme, width);
        await carryOver(context, theme, width);
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
