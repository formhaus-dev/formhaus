import { render } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'events',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

it('emits formEvent and the analyticsEvent alias on mount', () => {
  const { emitted } = render(FormRenderer, { props: { definition } });
  const expected = [[{ type: 'form_viewed' }], [{ type: 'step_viewed', stepId: 'one', stepIndex: 0 }]];
  expect(emitted().formEvent).toEqual(expected);
  expect(emitted().analyticsEvent).toEqual(expected);
});
