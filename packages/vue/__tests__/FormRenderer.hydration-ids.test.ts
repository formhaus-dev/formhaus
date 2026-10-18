import { afterEach, expect, it, vi } from 'vitest';
import { createApp, createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import FormRenderer from '../src/FormRenderer.vue';
import { plain } from './ssr.fixtures';

vi.mock('vue', async (original) => ({ ...(await original<typeof import('vue')>()), useId: undefined }));

afterEach(() => {
  document.body.innerHTML = '';
});

const twoForms = {
  render: () => [h(FormRenderer, { definition: plain, onSubmit: () => {} }), h(FormRenderer, { definition: plain, onSubmit: () => {} })],
};

function page() {
  return createSSRApp(twoForms);
}

async function hydrate() {
  const problems: string[] = [];
  await renderToString(page());
  const html = await renderToString(page());
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  const app = page();
  app.config.warnHandler = (message) => problems.push(message);
  app.mount(container);
  app.unmount();
  return { html, problems };
}

it('keeps field ids stable between server and client without Vue useId', async () => {
  const first = await hydrate();
  const second = await hydrate();
  expect(first.problems).toEqual([]);
  expect(second.html).toBe(first.html);
  const ids = [...first.html.matchAll(/<input[^>]* id="([^"]+)"[^>]* name="name"/g)].map((match) => match[1]);
  expect(new Set(ids).size).toBe(2);
});

it('keeps field ids unique across client-only apps without Vue useId', () => {
  const apps = [createApp(twoForms), createApp(twoForms)];
  const ids = apps.map((app) => {
    const container = document.body.appendChild(document.createElement('div'));
    app.mount(container);
    return [...container.querySelectorAll('input[name="name"]')].map((input) => input.id);
  });
  for (const app of apps) app.unmount();
  expect(new Set(ids.flat()).size).toBe(4);
});

it('prefixes field ids with the app idPrefix without Vue useId', async () => {
  const prefixed = (prefix: string) => {
    const app = page();
    Object.assign(app.config, { idPrefix: prefix });
    return app;
  };
  const problems: string[] = [];
  const ids: string[] = [];
  for (const prefix of ['a', 'b']) {
    const container = document.body.appendChild(document.createElement('div'));
    container.innerHTML = await renderToString(prefixed(prefix));
    const app = prefixed(prefix);
    app.config.warnHandler = (message) => problems.push(message);
    app.mount(container);
    ids.push(...[...container.querySelectorAll('input[name="name"]')].map((input) => input.id));
    app.unmount();
  }
  expect(problems).toEqual([]);
  expect(ids.map((id) => id[0])).toEqual(['a', 'a', 'b', 'b']);
  expect(new Set(ids).size).toBe(4);
});
