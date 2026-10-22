import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '../src/FormRenderer';

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
    render(
      <FormRenderer
        definition={definition}
        initialValues={{ business: true, company: 'Acme' }}
        hiddenValues={hiddenValues}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Business' }));
    expect(screen.queryByRole('textbox', { name: 'Company' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expected, []));
  });

  it('enables Submit when the field its disabled condition reads is hidden', async () => {
    const locked: FormDefinition = { ...definition, submit: { label: 'Save', disabled: [{ field: 'company', eq: 'Acme' }] } };
    render(
      <FormRenderer definition={locked} initialValues={{ business: true, company: 'Acme' }} hiddenValues="keep" onSubmit={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', true);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Business' }));
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty('disabled', false);
  });
});
