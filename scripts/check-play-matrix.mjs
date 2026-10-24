import { readFileSync } from 'node:fs';
import { apps, playwright, previewServer, watchErrors } from './play-server.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const presets = read('../docs/.vitepress/components/play/presets.json').map(({ id, file }) => ({
  name: `p:${id}`,
  hash: `p=${id}`,
  definition: read(`../examples/definitions/${file}.json`),
}));
const templates = read('../templates/index.json').map(({ slug }) => ({
  name: `t:${slug}`,
  hash: `t=${slug}`,
  definition: read(`../templates/${slug}.json`).definition,
}));
const forms = [...presets, ...templates];

const args = process.argv.slice(2);
const browsers = args.filter((arg) => !arg.startsWith('--'));
const only = args
  .find((arg) => arg.startsWith('--ds='))
  ?.slice(5)
  .split(',');
const systems = apps.filter((app) => !only || only.includes(app.id));
const workers = Number(process.env.PLAY_MATRIX_WORKERS ?? 4);
const controls =
  'input:not([type=hidden]), select, textarea, button, [role=radio], [role=checkbox], [role=combobox], [role=slider], [role=switch]';

function expected({ definition }) {
  const step = definition.steps?.[0] ?? definition;
  const labels = (step.fields ?? [])
    .filter((entry) => entry.label && entry.type !== 'hidden' && !entry.show && !entry.showAny && !entry.hidden)
    .map((entry) => entry.label);
  return labels.length ? labels : [step.title ?? definition.title];
}

function listen() {
  if (window !== window.top) return;
  window.__fh = [];
  window.addEventListener('message', (event) => {
    const frame = [...document.querySelectorAll('iframe')].find((element) => element.contentWindow === event.source);
    if (frame) window.__fh.push({ src: frame.src, type: event.data?.type, issues: event.data?.issues });
  });
}

async function render(page, system, form, problems) {
  const seen = await page.evaluate(() => window.__fh?.length ?? 0);
  const errors = [];
  const sink = (message) => errors.push(message);
  page.errors = sink;
  if (seen) await page.evaluate((hash) => (location.hash = hash), `ds=${system.id}&${form.hash}`);
  else await page.goto(`${page.base}/play#ds=${system.id}&${form.hash}`);
  const handle = await page
    .waitForFunction(
      ([from, id]) =>
        window.__fh
          ?.slice(from)
          .find((entry) => entry.src.includes(`/apps/${id}/`) && ['formhaus:rendered', 'formhaus:error'].includes(entry.type)),
      [seen, system.id],
      { timeout: 20000 },
    )
    .catch(() => null);
  const reply = await handle?.jsonValue();
  if (!reply) return problems.push('no rendered message');
  if (reply.type === 'formhaus:error') return problems.push(`definition error ${JSON.stringify(reply.issues).slice(0, 200)}`);
  const frame = page.frames().find((entry) => entry.url().includes(`/play/apps/${system.id}/`));
  for (const text of expected(form)) {
    const shown = await frame
      .getByText(text, { exact: false })
      .filter({ visible: true })
      .first()
      .waitFor({ timeout: 5000 })
      .then(
        () => true,
        () => false,
      );
    if (!shown) problems.push(`"${text}" is not visible`);
  }
  const visible = await frame.locator(controls).filter({ visible: true }).count();
  if (!visible) problems.push('no visible controls');
  const box = await page.locator(`iframe[src*="/apps/${system.id}/"]`).boundingBox();
  if (!box || box.height < 100) problems.push('the iframe is empty');
  await page.waitForTimeout(150);
  problems.push(...errors.map((error) => `console: ${error.slice(0, 200)}`));
}

async function runSystem(browser, base, system, report) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await context.addInitScript(listen);
  const page = await context.newPage();
  page.base = base;
  page.errors = () => {};
  watchErrors(page, (message) => page.errors(message));
  for (const form of forms) {
    const problems = [];
    try {
      await render(page, system, form, problems);
    } catch (error) {
      problems.push(`threw ${String(error).split('\n')[0]}`);
    }
    report.push({ system: system.id, form: form.name, problems });
  }
  await context.close();
}

const { base, ready, stop } = await previewServer();
const report = [];
try {
  await ready();
  for (const name of browsers.length ? browsers : ['chromium']) {
    const browser = await playwright[name].launch({ headless: true });
    const queue = [...systems];
    const started = Date.now();
    await Promise.all(
      Array.from({ length: workers }, async () => {
        while (queue.length) await runSystem(browser, base, queue.shift(), report);
      }),
    );
    await browser.close();
    const failed = report.filter((entry) => entry.problems.length);
    for (const entry of failed) console.log(`FAIL ${name} ${entry.system} ${entry.form}\n     ${entry.problems.join('\n     ')}`);
    console.log(
      `${name}: ${report.length - failed.length}/${report.length} previews rendered in ${Math.round((Date.now() - started) / 1000)} s`,
    );
    if (failed.length) process.exitCode = 1;
    report.length = 0;
  }
} finally {
  stop();
}
