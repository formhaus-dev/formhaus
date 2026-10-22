import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'record',
  title: 'Record',
  submit: { label: 'Save' },
  fields: [
    { key: 'business', type: 'checkbox', label: 'Business' },
    { key: 'company', type: 'text', label: 'Company', show: [{ field: 'business', eq: true }] },
  ],
};

describe('FormRenderer hiddenValues', () => {
  it.each([
    ['clear', { business: false }],
    ['keep', { business: false, company: 'Acme' }],
  ] as const)('submits with %s', async (hiddenValues, expected) => {
    const onSubmit = vi.fn();
    render(FormRenderer, { props: { definition, initialValues: { business: true, company: 'Acme' }, hiddenValues, onSubmit } });
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Business' }));
    expect(screen.queryByRole('textbox', { name: 'Company' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expected, []));
  });

  it('enables Submit when the field its disabled condition reads is hidden', async () => {
    const locked: FormDefinition = { ...definition, submit: { label: 'Save', disabled: [{ field: 'company', eq: 'Acme' }] } };
    render(FormRenderer, { props: { definition: locked, initialValues: { business: true, company: 'Acme' }, hiddenValues: 'keep' } });
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', true);
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Business' }));
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', false);
  });
});
