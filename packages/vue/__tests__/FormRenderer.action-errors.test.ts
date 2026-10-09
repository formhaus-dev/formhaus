import { fireEvent, render, screen } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = { id: 'action-errors', title: '', submit: { label: 'Send' }, steps: [
  { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  { id: 'two', title: 'Two', fields: [{ key: 'phone', type: 'text', label: 'Phone' }] },
] };

it('clears a failed action error once a retry succeeds', async () => {
  let attempts = 0;
  render(FormRenderer, { props: { definition,
    onBeforeStepChange: () => { if (attempts++ === 0) throw new Error('Offline'); } } });
  await fireEvent.click(screen.getByText('Continue'));
  expect(await screen.findByText('Offline')).toBeDefined();
  await fireEvent.click(screen.getByText('Continue'));
  expect(await screen.findByLabelText('Phone')).toBeDefined();
  expect(screen.queryByText('Offline')).toBeNull();
});

it('drops a failed action error when the definition is replaced', async () => {
  const fail = () => { throw new Error('Offline'); };
  const { rerender } = render(FormRenderer, { props: { definition, onBeforeStepChange: fail } });
  await fireEvent.click(screen.getByText('Continue'));
  expect(await screen.findByText('Offline')).toBeDefined();
  await rerender({ definition: { ...definition, id: 'replaced' } });
  expect(screen.queryByText('Offline')).toBeNull();
});
