import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { entryChecks } from './play-entry-checks.mjs';
import { playPage } from './play-page.mjs';

const require = createRequire(new URL('../packages/editor-react/package.json', import.meta.url));
const playwright = require('playwright');
const apps = JSON.parse(readFileSync(new URL('../docs/.vitepress/components/play/apps.json', import.meta.url), 'utf8'));

const browsers = process.argv.slice(2).length ? process.argv.slice(2) : ['chromium'];
const widths = [320, 390, 768, 861, 1024, 1180, 1280, 1440, 1920];
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

const { open, rendered, frameOf, edit, tone } = playPage(base);

const checks = {
  ...entryChecks(base, frameOf),

  async systems(page, problems) {
    await open(page);
    for (const app of apps) {
      await page.locator('.play-more__toggle').click();
      await page.locator('.play-menu__item', { hasText: app.label }).first().click();
      await rendered(page);
      const frame = frameOf(page, app.id);
      const label = await frame
        ?.getByText('First Name', { exact: false })
        .filter({ visible: true })
        .first()
        .waitFor({ timeout: 15000 })
        .then(
          () => true,
          () => false,
        );
      if (!label) problems.push(`${app.id}: the multi-step form did not render`);
    }
  },

  async theme(page, problems) {
    await open(page, '/play#ds=mui');
    const frame = frameOf(page, 'mui');
    const before = await tone(frame);
    await page.getByRole('button', { name: /Switch to (dark|light) theme/ }).click();
    await page.waitForTimeout(800);
    const after = await tone(frame);
    const dark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    if (!dark) problems.push('the page did not switch to dark');
    if (!(before > 0.7 && after < 0.3)) problems.push(`preview background went from ${before.toFixed(2)} to ${after.toFixed(2)}`);
  },

  async share(page, problems) {
    await open(page, '/play#ds=vuetify&w=phone');
    const text =
      '{\n  "id": "shared",\n  "title": "Shared form",\n  "submit": { "label": "Send" },\n  "fields": [{ "key": "pet", "type": "text", "label": "Pet name" }]\n}\n';
    await edit(page, text);
    await page.waitForTimeout(600);
    const url = page.url();
    if (!/[#&]d=/.test(url)) problems.push(`the hash has no definition: ${url}`);
    const copy = await page.context().newPage();
    await open(copy, url.slice(base.length));
    const restored = await copy.evaluate(() => document.querySelector('.cm-content')?.innerText.replace(/ /g, ' '));
    if (restored?.trim() !== text.trim()) problems.push(`restored text differs: ${JSON.stringify(restored)}`);
    const picked = await copy
      .getByRole('radio', { name: 'Vuetify' })
      .getAttribute('aria-checked')
      .catch(() => null);
    const selected = await copy.locator('.play-select--designs select').inputValue();
    if (picked !== 'true' && selected !== 'vuetify') problems.push('the design was not restored');
    const field = await frameOf(copy, 'vuetify')
      ?.getByLabel('Pet name')
      .waitFor({ timeout: 15000 })
      .then(
        () => true,
        () => false,
      );
    if (!field) problems.push('the shared form did not render');
    await copy.close();
  },

  async errors(page, problems) {
    await open(page);
    const height = await page.evaluate(() => window.innerHeight - document.querySelector('.play-bar').getBoundingClientRect().height);
    for (const [name, text, line] of [
      ['invalid', '{\n  "title": "x",\n  "fields": [\n', 4],
      ['empty', '', 1],
    ]) {
      await edit(page, text);
      const status = await page.locator('.play-status').textContent();
      if (status !== `JSON error on line ${line}`) problems.push(`${name}: status "${status}"`);
      if (!(await page.locator('.play-stale').isVisible())) problems.push(`${name}: no stale preview notice`);
      const main = await page.evaluate(() => document.querySelector('.play-main').getBoundingClientRect().height);
      const tabs = await page.evaluate(() => document.querySelector('.play-tabs').getBoundingClientRect().height);
      if (main < height - tabs - 40) problems.push(`${name}: the panes collapsed to ${main}px`);
    }
  },

  async menu(page, problems) {
    await open(page);
    const toggle = page.locator('.play-more__toggle');
    await toggle.focus();
    await page.keyboard.press('ArrowDown');
    const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
    if (!first?.startsWith('Default')) problems.push(`ArrowDown focused "${first}"`);
    await page.keyboard.press('End');
    const last = await page.evaluate(() => document.activeElement?.textContent?.trim());
    if (!last?.startsWith('USWDS')) problems.push(`End focused "${last}"`);
    await page.keyboard.press('ArrowDown');
    const wrapped = await page.evaluate(() => document.activeElement?.textContent?.trim());
    if (!wrapped?.startsWith('Default')) problems.push(`ArrowDown from the last item focused "${wrapped}"`);
    await page.keyboard.press('Escape');
    if ((await page.locator('.play-menu').count()) || !(await toggle.evaluate((element) => element === document.activeElement)))
      problems.push('Escape did not close the menu and return focus');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await rendered(page);
    const label = await toggle.textContent();
    if (!label?.includes('GOV.UK')) problems.push(`picking from the keyboard left the toggle at "${label}"`);
    if (!(await toggle.evaluate((element) => element === document.activeElement))) problems.push('focus did not return to the toggle');
  },

  async widths(page, problems) {
    await open(page);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(250);
      const toggle = page.locator('.play-more__toggle');
      if (await toggle.isVisible()) await toggle.click();
      const sizes = await page.evaluate(() => {
        const menu = document.querySelector('.play-menu')?.getBoundingClientRect();
        const bar = document.querySelector('.play-bar');
        return {
          page: document.documentElement.scrollWidth - window.innerWidth,
          bar: bar.scrollWidth - bar.clientWidth,
          menu: menu ? Math.max(0, -menu.left, menu.right - window.innerWidth, menu.bottom - window.innerHeight) : 0,
        };
      });
      if (sizes.page > 0 || sizes.bar > 0 || sizes.menu > 0) problems.push(`${width}px overflows ${JSON.stringify(sizes)}`);
      if (await toggle.isVisible()) await page.keyboard.press('Escape');
    }
  },

  async template(page, problems) {
    await open(page, '/play#t=contact-form');
    const label = await page
      .locator('.play-bar select')
      .first()
      .evaluate((select) => `${select.selectedOptions[0]?.parentElement?.label}/${select.selectedOptions[0]?.textContent}`);
    if (!label?.startsWith('Lead generation/')) problems.push(`template option "${label}"`);
    const text = await page.evaluate(() => document.querySelector('.cm-content')?.innerText);
    if (!text?.includes('"contact-form"')) problems.push('the template definition did not load');
    await page.evaluate(() => {
      location.hash = '#ds=antd&p=survey';
    });
    await rendered(page);
    const preset = await page.locator('.play-bar select').first().inputValue();
    const survey = await frameOf(page, 'antd')
      ?.getByRole('button', { name: 'Start' })
      .waitFor({ timeout: 15000 })
      .then(
        () => true,
        () => false,
      );
    if (preset !== 'survey' || !survey) problems.push(`a pasted hash did not switch the preset and design (${preset})`);
    const options = await page.locator('.play-bar select').first().locator('option').count();
    if (options < 56) problems.push(`the example select lists ${options} options`);
  },
};

const report = [];
try {
  await ready();
  for (const name of browsers) {
    const browser = await playwright[name].launch({ headless: true });
    for (const [check, run] of Object.entries(checks)) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
      await context.addInitScript(() => localStorage.setItem('vitepress-theme-appearance', 'light'));
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const problems = [];
      const errors = [];
      page.on('pageerror', (error) => errors.push(String(error)));
      page.on(
        'console',
        (message) => message.type() === 'error' && !message.text().startsWith('Failed to load resource') && errors.push(message.text()),
      );
      page.on(
        'response',
        (response) =>
          response.status() >= 400 && !response.url().endsWith('/s/script.js') && errors.push(`${response.status()} ${response.url()}`),
      );
      try {
        await run(page, problems);
      } catch (error) {
        problems.push(`threw ${String(error).split('\n')[0]}`);
      }
      problems.push(...errors.map((error) => `console: ${error.slice(0, 200)}`));
      report.push([`${name} ${check}`, problems]);
      await context.close();
    }
    await browser.close();
  }
} finally {
  server?.kill();
}

for (const [name, problems] of report)
  console.log(`${problems.length ? 'FAIL' : 'ok  '} ${name}${problems.map((problem) => `\n     ${problem}`).join('')}`);
if (report.some(([, problems]) => problems.length)) process.exitCode = 1;
