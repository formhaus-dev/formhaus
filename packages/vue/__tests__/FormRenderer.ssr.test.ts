import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'ssr-test',
  title: 'SSR',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'email', type: 'email', label: 'Email' },
  ],
};

const multiStepDefinition: FormDefinition = {
  id: 'ssr-steps',
  title: 'SSR Steps',
  submit: { label: 'Submit' },
  steps: [
    {
      id: 'step1',
      title: 'Step 1',
      fields: [{ key: 'first', type: 'text', label: 'First' }],
    },
    {
      id: 'step2',
      title: 'Step 2',
      fields: [{ key: 'second', type: 'text', label: 'Second' }],
    },
  ],
};

const sourced: FormDefinition = {
  id: 'ssr-sources',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'utm_source', type: 'hidden', label: 'Source', source: { query: 'utm_source' }, defaultValue: 'direct' },
    { key: 'device', type: 'hidden', source: 'device' },
  ],
};

function render(props: Record<string, unknown>) {
  return renderToString(createSSRApp({ render: () => h(FormRenderer, { onSubmit: () => {}, ...props }) }));
}

describe('FormRenderer SSR', () => {
  it('renders to string without throwing', async () => {
    await expect(render({ definition })).resolves.toContain('<form');
  });

  it('emits markup containing field labels on the server', async () => {
    const html = await render({ definition });
    expect(html).toContain('Name');
    expect(html).toContain('Email');
    expect(html).toContain('Send');
  });

  it('renders multi-step initial step on the server', async () => {
    const html = await render({ definition: multiStepDefinition });
    expect(html).toContain('First');
    expect(html).not.toContain('Second');
  });

  it('respects initialValues during server render', async () => {
    const html = await render({ definition, initialValues: { name: 'Ada' } });
    expect(html).toContain('value="Ada"');
  });

  it('renders hidden sources from defaultValue without reading the page', async () => {
    const location = Object.getOwnPropertyDescriptor(window, 'location')!;
    Object.defineProperty(window, 'location', {
      configurable: true,
      get: () => {
        throw new Error('read during render');
      },
    });
    try {
      const html = await render({ definition: sourced });
      expect(html).toContain('value="direct"');
      expect(html).toContain('name="device"');
      expect(html).not.toContain('undefined');
    } finally {
      Object.defineProperty(window, 'location', location);
    }
  });
});
