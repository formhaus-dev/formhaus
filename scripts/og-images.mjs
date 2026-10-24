import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { card } from './og/card.mjs';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'docs/.vitepress/dist');
const out = join(root, 'docs/public/og');
const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const sections = read('packages/site-theme/src/seo/og-sections.json');
const templates = read('templates/index.json');
const only = process.argv.slice(2);
const maxBytes = 60 * 1024;

if (!existsSync(join(dist, 'index.html'))) {
  console.error('Build the docs first: pnpm docs:build');
  process.exit(1);
}

const require = createRequire(join(root, 'packages/editor-react/package.json'));
const { chromium } = require(process.env.PLAYWRIGHT_PATH ?? 'playwright');

const categories = {
  'lead-gen': 'Lead generation',
  intake: 'Intake',
  application: 'Applications',
  feedback: 'Feedback',
  survey: 'Surveys',
  registration: 'Registration',
  quiz: 'Quizzes',
  operations: 'Operations',
};
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};
const generated = new Map();

function resolve(pathname) {
  const path = join(dist, decodeURIComponent(pathname));
  return [path, `${path}.html`, join(path, 'index.html')].find((file) => existsSync(file) && statSync(file).isFile());
}

const server = createServer((request, response) => {
  const { pathname } = new URL(request.url, 'http://localhost');
  const file = generated.has(pathname) ? undefined : resolve(pathname);
  if (!generated.has(pathname) && !file) {
    response.statusCode = 404;
    return response.end();
  }
  response.setHeader('Content-Type', file ? (types[extname(file)] ?? 'application/octet-stream') : 'text/html');
  response.end(file ? readFileSync(file) : generated.get(pathname));
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const font = `/assets/${readdirSync(join(dist, 'assets')).find((name) => /^inter-roman-latin\.[^.]+\.woff2$/.test(name))}`;

const home = { slug: 'contact-form', address: 'formhaus.cc/k3Fq9xT2bW' };

const jobs = [
  ...Object.entries(sections)
    .filter(([, section]) => !section.static)
    .map(([name, section]) => ({ name, ...section, ...(name === 'home' ? home : {}) })),
  ...templates.map((template) => ({
    name: `templates/${template.slug}`,
    slug: template.slug,
    eyebrow: `${categories[template.category] ?? template.category} template`,
    title: template.title,
    subtitle: template.summary,
    meta: `${plural(template.steps, 'step')} · ${plural(template.fields, 'field')}`,
  })),
].filter((job) => !only.length || only.some((name) => job.name === name || job.name.startsWith(`${name}/`)));

const browser = await chromium.launch({ headless: true });
const options = { colorScheme: 'light', reducedMotion: 'reduce' };
const cards = await browser.newPage({ ...options, viewport: { width: 1200, height: 630 } });
const forms = await browser.newPage({ ...options, viewport: { width: 520, height: 2400 }, deviceScaleFactor: 2 });

async function formShot(slug, chrome = 0) {
  await forms.goto(`${origin}/templates/${slug}`, { waitUntil: 'networkidle' });
  const form = forms.locator('.tpl-preview__form');
  await form.locator('input:not([type=hidden]), select, textarea').first().waitFor();
  await forms.evaluate(() => document.activeElement?.blur());
  const shot = await form.screenshot({ animations: 'disabled', caret: 'hide' });
  const height = (404 * shot.readUInt32BE(20)) / shot.readUInt32BE(16);
  return { src: `data:image/png;base64,${shot.toString('base64')}`, clip: 64 + 28 + chrome + height > 630 - 8 };
}

async function render(job) {
  const form = job.slug ? await formShot(job.slug, job.address ? 38 : 0) : undefined;
  generated.set('/__og', card({ ...job, font, form }));
  await cards.goto(`${origin}/__og`, { waitUntil: 'networkidle' });
  await cards.evaluate(() => document.fonts.ready);
  let jpg = await cards.screenshot({ type: 'jpeg', quality: 85 });
  if (jpg.length > maxBytes) jpg = await cards.screenshot({ type: 'jpeg', quality: 80 });
  const file = join(out, `${job.name}.jpg`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, jpg);
  return jpg.length;
}

const sizes = [];
for (const job of jobs) {
  const bytes = await render(job);
  sizes.push(bytes);
  console.log(`${bytes > maxBytes ? '!' : ' '} ${(bytes / 1024).toFixed(1).padStart(5)} KB  og/${job.name}.jpg`);
}
await browser.close();
server.close();
console.log(`${sizes.length} images, ${(sizes.reduce((a, b) => a + b, 0) / 1024).toFixed(0)} KB total`);
