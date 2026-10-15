import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const definition: FormDefinition = {
  id: 'errors',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
};

it('keeps validation errors when the parent re-renders with equal external errors', async () => {
  const { rerender } = render(<FormRenderer definition={definition} errors={{}} onSubmit={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  expect(await screen.findByText('This field is required')).toBeDefined();
  rerender(<FormRenderer definition={definition} errors={{}} onSubmit={() => {}} />);
  expect(screen.getByText('This field is required')).toBeDefined();
});

it('applies changed external errors', async () => {
  const { rerender } = render(<FormRenderer definition={definition} errors={{}} onSubmit={() => {}} />);
  rerender(<FormRenderer definition={definition} errors={{ name: 'Taken' }} onSubmit={() => {}} />);
  expect(await screen.findByText('Taken')).toBeDefined();
});

it('shows a repeated server error after the user edits the field', async () => {
  const { rerender } = render(<FormRenderer definition={definition} errors={{ name: 'Taken' }} onSubmit={() => {}} />);
  expect(await screen.findByText('Taken')).toBeDefined();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Ada' } });
  expect(screen.queryByText('Taken')).toBeNull();
  rerender(<FormRenderer definition={definition} errors={{ name: 'Taken' }} onSubmit={() => {}} />);
  expect(await screen.findByText('Taken')).toBeDefined();
});

const pair: FormDefinition = {
  id: 'pair',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'first', type: 'text', label: 'First' },
    { key: 'second', type: 'text', label: 'Second' },
  ],
};

it('focuses the invalid field when external errors arrive while a button has focus', async () => {
  const { rerender } = render(<FormRenderer definition={pair} onSubmit={() => {}} />);
  screen.getByRole('button', { name: 'Send' }).focus();
  rerender(<FormRenderer definition={pair} errors={{ second: 'Taken' }} onSubmit={() => {}} />);
  await screen.findByText('Taken');
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Second/ })));
});

it('keeps focus in a text field when external errors arrive for another field', async () => {
  const { rerender } = render(<FormRenderer definition={pair} onSubmit={() => {}} />);
  const first = screen.getByRole('textbox', { name: /First/ });
  first.focus();
  rerender(<FormRenderer definition={pair} errors={{ second: 'Taken' }} onSubmit={() => {}} />);
  await screen.findByText('Taken');
  await new Promise((done) => setTimeout(done));
  expect(document.activeElement).toBe(first);
});

it('does not move focus for external errors passed on mount', async () => {
  render(<FormRenderer definition={pair} errors={{ second: 'Taken' }} onSubmit={() => {}} />);
  await screen.findByText('Taken');
  expect(document.activeElement).toBe(document.body);
});
