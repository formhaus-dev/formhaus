import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../packages/editor-react/package.json', import.meta.url));
const { chromium } = require('playwright');

const pages = process.env.LANDING_NAV_PAGES?.split(',') ?? ['/', '/cloud', '/templates/', '/templates/contact-form', '/build'];
const widths = [1440, 1280, 1024, 390];
const themes = ['light', 'dark'];
const tolerance = 0.5;
const port = process.env.LANDING_NAV_PORT ?? String(4900 + Math.floor(Math.random() * 600));
const base = process.env.LANDING_NAV_BASE ?? `http://localhost:${port}`;
const server = process.env.LANDING_NAV_BASE
  ? null
  : spawn('pnpm', ['--dir', 'docs', 'exec', 'vitepress', 'preview', '--port', port, '--strictPort'], { stdio: 'ignore' });

async function ready() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ok = await fetch(`${base}/cloud`).then(
      (res) => res.ok,
      () => false,
    );
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`docs preview never answered on ${base}`);
}

function measureBar() {
  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  const label = (el) => el.getAttribute('aria-label') || el.textContent.trim().replace(/\s+/g, ' ');
  const items = [...document.querySelectorAll('.VPNavBar a, .VPNavBar button')].filter(visible);
  return items.map((el) => {
    const rect = el.getBoundingClientRect();
    return { name: label(el), x: rect.x, width: rect.width };
  });
}

function measureScreen() {
  const screen = document.querySelector('.VPNavScreen');
  if (!screen) return [];
  return [...screen.querySelectorAll('a, button')]
    .filter((el) => el.getBoundingClientRect().width > 0)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return `${el.textContent.trim().replace(/\s+/g, ' ')}@${Math.round(rect.y)}`;
    });
}

function compare(reference, items, where, problems) {
  if (reference.length !== items.length) {
    problems.push(`${where}: ${items.length} nav items, expected ${reference.length} (${items.map((i) => i.name).join(', ')})`);
    return;
  }
  reference.forEach((ref, index) => {
    const item = items[index];
    if (item.name !== ref.name) problems.push(`${where}: item ${index} is "${item.name}", expected "${ref.name}"`);
    if (Math.abs(item.x - ref.x) > tolerance || Math.abs(item.width - ref.width) > tolerance) {
      problems.push(
        `${where}: "${item.name}" at x=${item.x.toFixed(1)} w=${item.width.toFixed(1)}, expected x=${ref.x.toFixed(1)} w=${ref.width.toFixed(1)}`,
      );
    }
  });
}

const problems = [];
const table = [];
try {
  await ready();
  const browser = await chromium.launch({ headless: true });
  for (const theme of themes) {
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
      await context.addInitScript((value) => localStorage.setItem('vitepress-theme-appearance', value), theme);
      const page = await context.newPage();
      let reference;
      let screenReference;
      for (const path of pages) {
        await page.goto(base + path, { waitUntil: 'networkidle' });
        await page.waitForTimeout(300);
        const items = await page.evaluate(measureBar);
        const where = `${path} ${theme} ${width}`;
        if (!reference) {
          reference = items;
          table.push(`${theme} ${width}: ${items.map((i) => `${i.name} ${i.x.toFixed(1)}/${i.width.toFixed(1)}`).join(' | ')}`);
        } else {
          compare(reference, items, where, problems);
        }
        const burger = page.locator('.VPNavBarHamburger');
        if (await burger.isVisible()) {
          await burger.click();
          await page.waitForTimeout(300);
          const screen = await page.evaluate(measureScreen);
          if (!screenReference) screenReference = screen.join(' | ');
          else if (screen.join(' | ') !== screenReference)
            problems.push(`${where}: open menu shows "${screen.join(' | ')}", expected "${screenReference}"`);
          await burger.click();
        }
      }
      if (screenReference) table.push(`${theme} ${width} menu: ${screenReference}`);
      await context.close();
    }
  }
  await browser.close();
} finally {
  server?.kill();
}

for (const row of table) console.log(row);
if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
} else {
  console.log(`nav identical on ${pages.length} pages at ${widths.join(', ')} in ${themes.join(' and ')}`);
}
