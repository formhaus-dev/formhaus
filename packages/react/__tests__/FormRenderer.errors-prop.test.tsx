import { fireEvent, render, screen } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const definition: FormDefinition = { id: 'errors', title: '', submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }] };

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
