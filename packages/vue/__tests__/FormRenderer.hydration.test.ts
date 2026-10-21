import type { FormDefinition } from '@formhaus/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type App, type Component, createSSRApp, defineComponent, h, nextTick } from 'vue';
import { renderToString } from 'vue/server-renderer';
import FormhausForm from '../src/cloud/FormhausForm.vue';
import FormRenderer from '../src/FormRenderer.vue';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';
import { useLocalizedForm } from '../src/i18n';
import { definition as localizedDefinition, overlay } from './i18n.fixtures';
import { choices, choiceValues, conditions, group, groupValues, hidden, plain, questionTypes, questionValues, steps } from './ssr.fixtures';
import { randomized, shownOrder, toolValues, writtenOrder } from './ssr.fixtures';

const BROWSER_GLOBALS = ['window', 'document', 'localStorage', 'sessionStorage', 'location', 'requestAnimationFrame'] as const;
const apps: App[] = [];

function collect(app: App, problems: string[]) {
  app.config.warnHandler = (message) => {
    if (/hydrat|mismatch/i.test(message)) problems.push(message);
  };
  return app;
}

async function serverRender(root: Component, problems: string[]): Promise<string> {
  const saved = BROWSER_GLOBALS.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const);
  const fetch = globalThis.fetch;
  const requests: unknown[] = [];
  globalThis.fetch = async (input) => {
    requests.push(input);
    throw new Error('fetch during server render');
  };
  for (const name of BROWSER_GLOBALS) Object.defineProperty(globalThis, name, { value: undefined, configurable: true, writable: true });
  try {
    return await renderToString(collect(createSSRApp(root), problems));
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    }
    globalThis.fetch = fetch;
    expect(requests).toEqual([]);
  }
}

async function hydrateRaw(root: Component) {
  const problems: string[] = [];
  const html = await serverRender(root, problems);
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  const error = vi.spyOn(console, 'error');
  const warn = vi.spyOn(console, 'warn');
  try {
    const app = collect(createSSRApp(root), problems);
    app.mount(container);
    apps.push(app);
    await Promise.resolve();
    const logged = [...error.mock.calls, ...warn.mock.calls]
      .map((args) => args.map(String).join(' '))
      .filter((message) => /hydrat|mismatch/i.test(message));
    return { html, container, problems: [...problems, ...logged] };
  } finally {
    error.mockRestore();
    warn.mockRestore();
  }
}

async function hydrate(root: Component) {
  const { html, container, problems } = await hydrateRaw(root);
  expect(problems).toEqual([]);
  return { html, container };
}

function form(definition: FormDefinition, props: Record<string, unknown> = {}): Component {
  return { render: () => h(FormRenderer, { definition, onSubmit: () => {}, ...props }) };
}

function serverDom(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

afterEach(() => {
  vi.unstubAllGlobals();
  for (const app of apps.splice(0)) app.unmount();
  document.body.innerHTML = '';
});

describe('FormRenderer hydration', () => {
  it('reports a mismatch between server and client markup', async () => {
    const { problems } = await hydrateRaw({ render: () => h('p', typeof window === 'undefined' ? 'server' : 'client') });
    expect(problems.length).toBeGreaterThan(0);
  });

  it('hydrates a plain form', async () => {
    const { html, container } = await hydrate(form(plain));
    expect(html).toContain('Full name');
    const input = container.querySelector<HTMLInputElement>('input[name="name"]')!;
    expect(container.querySelector(`label[for="${input.id}"]`)).toBeTruthy();
    expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe('Full name');
  });

  it('hydrates two forms on one page with distinct ids', async () => {
    const { container } = await hydrate({ render: () => [h(form(plain)), h(form(plain))] });
    const ids = [...container.querySelectorAll('input[name="name"]')].map((input) => input.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('hydrates a multi-step form on its first step', async () => {
    const { html, container } = await hydrate(form(steps));
    expect(html).toContain('First');
    expect(html).not.toContain('Second');
    expect(container.textContent).toContain('Step one');
  });

  it('hydrates select, radio, checkbox and multiselect with options', async () => {
    const { html, container } = await hydrate(form(choices, { initialValues: choiceValues }));
    expect(container.querySelector<HTMLSelectElement>('select[name="color"]')!.value).toBe('green');
    expect(container.querySelector<HTMLInputElement>('input[name="size"][value="blue"]')!.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="terms"]')!.checked).toBe(true);
    expect(container.textContent).toContain('Blue');
    expect(serverDom(html).querySelector<HTMLSelectElement>('select[name="color"]')!.value).toBe('green');
  });

  it('hydrates scale, rating, picture options, a matrix and an empty section', async () => {
    const { html, container } = await hydrate(form(questionTypes, { initialValues: questionValues }));
    expect(container.querySelector<HTMLInputElement>('input[name="nps"][value="0"]')!.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="stars"][value="4"]')!.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>('input[name="clear"][value="3"]')!.checked).toBe(true);
    expect(container.querySelector('.fh-field__option-image')!.getAttribute('alt')).toBe('');
    expect(container.querySelector('.fh-section--matrix .fh-section__matrix-header')!.textContent).toBe('DisagreeNeutralAgree');
    expect(serverDom(html).querySelector<HTMLInputElement>('input[name="nps"][value="0"]')!.checked).toBe(true);
  });

  it('selects the select placeholder in the server HTML without a value', async () => {
    const { html, container } = await hydrate(form(choices));
    expect(serverDom(html).querySelector<HTMLSelectElement>('select[name="color"]')!.selectedIndex).toBe(0);
    expect(container.querySelector<HTMLSelectElement>('select[name="color"]')!.selectedIndex).toBe(0);
  });

  it('renders the seeded option order on the server and the client', async () => {
    const { html, container } = await hydrate(form(randomized, { seed: 'visitor-1' }));
    const order = shownOrder('visitor-1');
    expect(order).not.toEqual(writtenOrder);
    expect(toolValues(serverDom(html))).toEqual(order);
    expect(toolValues(container)).toEqual(order);
  });

  it('renders the written option order on the server and shuffles it after hydration without a seed', async () => {
    vi.stubGlobal('crypto', { getRandomValues: (bytes: Uint8Array) => bytes.fill(7) });
    const { html, container } = await hydrate(form(randomized));
    await nextTick();
    expect(toolValues(serverDom(html))).toEqual(writtenOrder);
    expect(shownOrder('07'.repeat(16))).not.toEqual(writtenOrder);
    expect(toolValues(container)).toEqual(shownOrder('07'.repeat(16)));
  });

  it('hydrates a group with items', async () => {
    const { html, container } = await hydrate(form(group, { initialValues: groupValues }));
    expect(html).toContain('Person 2');
    expect(container.querySelectorAll('input[value="Ada"], input[value="Alan"]')).toHaveLength(2);
    expect(html).toContain('value="Lead"');
  });

  it('hydrates a group from defaultItems', async () => {
    const { html } = await hydrate(form(group));
    expect(html).toContain('Person 1');
    expect(html).not.toContain('Person 2');
  });

  it('hydrates hidden fields with defaultValue without reading the page', async () => {
    const { html } = await hydrate(form(hidden));
    expect(html).toContain('value="pro"');
    expect(html).toContain('value="direct"');
    expect(html).not.toContain('undefined');
  });

  it('hydrates conditions that are true and false on the server', async () => {
    const { html, container } = await hydrate(form(conditions));
    expect(html).toContain('Company name');
    expect(html).not.toContain('Birthday');
    expect(html).not.toContain('VAT number');
    expect(container.textContent).toContain('Company name');
  });

  it('hydrates conditions driven by initialValues', async () => {
    const { html } = await hydrate(form(conditions, { initialValues: { kind: 'person' } }));
    expect(html).not.toContain('Company name');
    expect(html).toContain('Birthday');
    expect(html).toContain('VAT number');
  });

  it('hydrates initialValues', async () => {
    const { html, container } = await hydrate(form(plain, { initialValues: { name: 'Ada', message: 'Hi', born: '1815-12-10' } }));
    expect(html).toContain('value="Ada"');
    expect(container.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('Hi');
    expect(container.querySelector<HTMLInputElement>('input[name="born"]')!.value).toBe('1815-12-10');
  });

  it('hydrates the headless renderer', async () => {
    await hydrate({ render: () => h(HeadlessFormRenderer, { definition: plain, onSubmit: () => {} }) });
  });

  it('hydrates under a dark theme attribute', async () => {
    const { container } = await hydrate({ render: () => h('div', { 'data-fh-theme': 'dark' }, [h(form(steps))]) });
    expect(container.querySelector('[data-fh-theme="dark"] .fh-form')).toBeTruthy();
  });

  it('hydrates a localized form', async () => {
    const Localized = defineComponent({
      setup() {
        const localized = useLocalizedForm(localizedDefinition, { overlay, lang: 'ru' });
        return () => h(FormRenderer, { ...localized.value, onSubmit: () => {} });
      },
    });
    const { html } = await hydrate(Localized);
    expect(html).toContain('lang="ru"');
    expect(html).toContain('Почта');
  });
});

describe('FormhausForm hydration', () => {
  const initialForm = { version: 3, definition: plain, settings: {} };

  it('renders initialForm on the server without a spinner or a request', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('no network'));
    try {
      const { html, container } = await hydrate({
        render: () => h(FormhausForm, { id: 'abc', initialForm }, { fallback: () => h('p', 'Loading') }),
      });
      expect(html).toContain('Full name');
      expect(html).not.toContain('Loading');
      expect(html).not.toContain('aria-busy="true"');
      expect(container.querySelector('input[name="_fh_hp"]')).toBeTruthy();
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      fetch.mockRestore();
    }
  });

  it('renders the fallback on the server without initialForm', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    try {
      const { html } = await hydrate({ render: () => h(FormhausForm, { id: 'abc' }, { fallback: () => h('p', 'Loading') }) });
      expect(html).toContain('Loading');
    } finally {
      fetch.mockRestore();
    }
  });
});
