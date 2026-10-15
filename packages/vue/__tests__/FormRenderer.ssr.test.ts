import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import FormRenderer from '../src/FormRenderer.vue';

const sourced: FormDefinition = {
  id: 'ssr-sources',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'utm_source', type: 'hidden', label: 'Source', source: { query: 'utm_source' }, defaultValue: 'direct' },
    { key: 'device', type: 'hidden', label: 'Device', source: 'device' },
  ],
};

describe('FormRenderer SSR', () => {
  it('renders hidden sources from defaultValue without reading the page', async () => {
    const location = Object.getOwnPropertyDescriptor(window, 'location')!;
    Object.defineProperty(window, 'location', {
      configurable: true,
      get: () => {
        throw new Error('read during render');
      },
    });
    try {
      const html = await renderToString(createSSRApp({ render: () => h(FormRenderer, { definition: sourced, onSubmit: () => {} }) }));
      expect(html).toContain('value="direct"');
      expect(html).toContain('name="device"');
    } finally {
      Object.defineProperty(window, 'location', location);
    }
  });
});
