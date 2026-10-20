import { fireEvent, render } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';
import TextField from '../src/fields/TextField.vue';
import CheckboxField from '../src/fields/CheckboxField.vue';

const definition: FormDefinition = {
  id: 'events',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

it('emits formEvent on mount', () => {
  const { emitted } = render(FormRenderer, { props: { definition, onFormEvent: () => {} } });
  expect(emitted().formEvent).toEqual([[{ type: 'form_viewed' }], [{ type: 'step_viewed', stepId: 'one', stepIndex: 0 }]]);
});

describe.each([
  ['FormRenderer', FormRenderer],
  ['HeadlessFormRenderer', HeadlessFormRenderer],
])('%s once listeners', (_name, component) => {
  it('calls a .once handler', () => {
    const onFormEventOnce = vi.fn();
    render(component, { props: { definition, components: { text: TextField }, onFormEventOnce } });
    expect(onFormEventOnce).toHaveBeenCalledOnce();
    expect(onFormEventOnce).toHaveBeenCalledWith({ type: 'form_viewed' });
  });
});

describe.each([
  ['FormRenderer', FormRenderer],
  ['HeadlessFormRenderer', HeadlessFormRenderer],
])('%s listener added after mount', (_name, component) => {
  it('reports the next visibility change', async () => {
    const conditional: FormDefinition = {
      id: 'late',
      title: '',
      submit: { label: 'Send' },
      fields: [
        { key: 'company', type: 'checkbox', label: 'Company' },
        { key: 'vat', type: 'text', label: 'VAT', show: [{ field: 'company', eq: true }] },
      ],
    };
    const onFormEvent = vi.fn();
    const props = { definition: conditional, components: { text: TextField, checkbox: CheckboxField } };
    const { rerender, getByLabelText } = render(component, { props });
    await rerender({ ...props, onFormEvent });
    await fireEvent.click(getByLabelText('Company'));
    expect(onFormEvent.mock.calls).toEqual([[{ type: 'field_shown', fieldKey: 'vat' }]]);
  });
});
