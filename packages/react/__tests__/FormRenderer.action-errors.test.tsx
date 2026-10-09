import { fireEvent, render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const definition: FormDefinition = { id: 'action-errors', title: '', submit: { label: 'Send' }, steps: [
  { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  { id: 'two', title: 'Two', fields: [{ key: 'phone', type: 'text', label: 'Phone' }] },
] };

it('clears a failed action error once a retry succeeds', async () => {
  let attempts = 0;
  render(<FormRenderer definition={definition} onSubmit={() => {}}
    onBeforeStepChange={() => { if (attempts++ === 0) throw new Error('Offline'); }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('Offline')).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByLabelText('Phone')).toBeDefined();
  expect(screen.queryByText('Offline')).toBeNull();
});

it('drops a failed action error when the definition is replaced', async () => {
  const fail = () => { throw new Error('Offline'); };
  const { rerender } = render(<FormRenderer definition={definition} onSubmit={() => {}} onBeforeStepChange={fail} />);
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
  expect(await screen.findByText('Offline')).toBeDefined();
  rerender(<FormRenderer definition={{ ...definition, id: 'replaced' }} onSubmit={() => {}} onBeforeStepChange={fail} />);
  expect(screen.queryByText('Offline')).toBeNull();
});
