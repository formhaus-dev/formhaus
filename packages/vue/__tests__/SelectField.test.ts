import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'country',
  title: 'Country',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      validation: { required: true },
      options: [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
      ],
    },
  ],
};

describe('SelectField', () => {
  it('starts a required select without a placeholder empty so its first option can be picked', async () => {
    const onSubmit = vi.fn();
    render(FormRenderer, { props: { definition, onSubmit } });
    const select = screen.getByRole('combobox', { name: /Country/ }) as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(select.selectedIndex).toBe(-1);
    await fireEvent.click(screen.getByText('Send'));
    expect(screen.getByText('This field is required')).toBeDefined();
    await fireEvent.update(select, 'us');
    expect(select.value).toBe('us');
    expect(screen.queryByText('This field is required')).toBeNull();
    await fireEvent.click(screen.getByText('Send'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ country: 'us' }, expect.any(Array)));
  });
});
