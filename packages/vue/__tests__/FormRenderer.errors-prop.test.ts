import { fireEvent, render, screen } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = { id: 'errors', title: '', submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }] };

it('keeps validation errors when the parent re-renders with equal external errors', async () => {
  const { rerender } = render(FormRenderer, { props: { definition, errors: {} } });
  await fireEvent.click(screen.getByText('Send'));
  expect(await screen.findByText('This field is required')).toBeDefined();
  await rerender({ errors: {} });
  expect(screen.getByText('This field is required')).toBeDefined();
});

it('applies changed external errors', async () => {
  const { rerender } = render(FormRenderer, { props: { definition, errors: {} } });
  await rerender({ errors: { name: 'Taken' } });
  expect(await screen.findByText('Taken')).toBeDefined();
});

it('shows a repeated server error after the user edits the field', async () => {
  const { rerender } = render(FormRenderer, { props: { definition, errors: { name: 'Taken' } } });
  expect(await screen.findByText('Taken')).toBeDefined();
  await fireEvent.update(screen.getByRole('textbox'), 'Ada');
  expect(screen.queryByText('Taken')).toBeNull();
  await rerender({ errors: { name: 'Taken' } });
  expect(await screen.findByText('Taken')).toBeDefined();
});

it('applies external errors to an engine created for a new definition', async () => {
  const { rerender } = render(FormRenderer, { props: { definition, errors: { name: 'Taken' } } });
  expect(await screen.findByText('Taken')).toBeDefined();
  await rerender({ definition: { ...definition, id: 'errors-2' } });
  expect(await screen.findByText('Taken')).toBeDefined();
});
