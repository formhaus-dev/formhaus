import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { defineComponent, h, ref } from 'vue';
import { expect, it, vi } from 'vitest';
import * as entry from '../src';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = { id: 'contract', title: '', submit: { label: 'Send' }, steps: [
  { id: 'one', title: 'First step', fields: [{ key: 'name', type: 'text', label: 'Name' }], skip: { label: 'Skip' } },
  { id: 'two', title: 'Second', fields: [{ key: 'city', type: 'text', label: 'City' }] },
] };

it('awaits an @submit listener with values and skipped steps', async () => {
  let release!: () => void;
  const save = vi.fn(() => new Promise<void>((done) => { release = done; }));
  const Host = defineComponent({ setup: () => () => h(FormRenderer, { definition, onSubmit: save }) });
  render(Host);
  await fireEvent.click(screen.getByText('Skip'));
  await fireEvent.update(await screen.findByLabelText('City'), 'Oslo');
  await fireEvent.click(screen.getByText('Send'));
  await waitFor(() => expect(save).toHaveBeenCalledWith({ city: 'Oslo' }, ['one']));
  expect(document.querySelector('form')?.getAttribute('aria-busy')).toBe('true');
  release();
  await waitFor(() => expect(document.querySelector('form')?.getAttribute('aria-busy')).toBe('false'));
});

it('renders the step title at the heading level', () => {
  render(FormRenderer, { props: { definition, headingLevel: 3 } });
  expect(screen.getByRole('heading', { level: 3, name: 'First step' })).toBeDefined();
  render(FormRenderer, { props: { definition } });
  expect(screen.getByRole('heading', { level: 2, name: 'First step' })).toBeDefined();
});

it('supports v-model on FormhausField and exports every built-in field', async () => {
  const value = ref<unknown>('');
  render(defineComponent({ setup: () => () => h(entry.FormhausField, {
    field: { key: 'name', type: 'text', label: 'Name' },
    modelValue: value.value,
    'onUpdate:modelValue': (next: unknown) => { value.value = next; },
  }) }));
  await fireEvent.update(screen.getByLabelText('Name'), 'Ada');
  expect(value.value).toBe('Ada');
  for (const name of ['TextField', 'TextareaField', 'SelectField', 'AutocompleteField', 'MultiselectField', 'CheckboxField', 'RadioField', 'SwitchField', 'FileField', 'DateField', 'DateTimeField', 'defaultFieldComponents']) {
    expect(entry[name as keyof typeof entry]).toBeDefined();
  }
});

it('creates a new engine when the definition object changes', async () => {
  const { rerender } = render(FormRenderer, { props: { definition } });
  await fireEvent.update(screen.getByLabelText('Name'), 'Ada');
  await rerender({ definition: { ...definition } });
  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('');
});
