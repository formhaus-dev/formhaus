import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'errors',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
};

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
  const { rerender } = render(FormRenderer, { props: { definition: pair } });
  screen.getByRole('button', { name: 'Send' }).focus();
  await rerender({ errors: { second: 'Taken' } });
  await screen.findByText('Taken');
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /Second/ })));
});

it('keeps focus in a text field when external errors arrive for another field', async () => {
  const { rerender } = render(FormRenderer, { props: { definition: pair } });
  const first = screen.getByRole('textbox', { name: /First/ });
  first.focus();
  await rerender({ errors: { second: 'Taken' } });
  await screen.findByText('Taken');
  await new Promise((done) => setTimeout(done));
  expect(document.activeElement).toBe(first);
});

it('does not move focus for external errors passed on mount', async () => {
  render(FormRenderer, { props: { definition: pair, errors: { second: 'Taken' } } });
  await screen.findByText('Taken');
  expect(document.activeElement).toBe(document.body);
});
