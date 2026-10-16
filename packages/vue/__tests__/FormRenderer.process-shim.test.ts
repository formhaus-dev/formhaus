import { render, screen } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'shim',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'score', type: 'x-score', label: 'Score' },
  ],
};

afterEach(() => vi.unstubAllGlobals());

it('renders when a process shim has no env', () => {
  vi.stubGlobal('process', {});
  render(FormRenderer, { props: { definition } });
  expect(screen.getByLabelText('Name')).toBeDefined();
});
