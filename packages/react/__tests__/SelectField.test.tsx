import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '../src/FormRenderer';

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
  it('starts a required select without a placeholder empty so its first option can be picked', () => {
    const onSubmit = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} />);
    const select = screen.getByRole('combobox', { name: /Country/ }) as HTMLSelectElement;
    expect(select.value).toBe('');
    expect(select.options[0]).toMatchObject({ value: '', disabled: true, hidden: true });
    fireEvent.click(screen.getByText('Send'));
    expect(screen.getByText('This field is required')).toBeDefined();
    fireEvent.change(select, { target: { value: 'us' } });
    expect(select.value).toBe('us');
    expect(screen.queryByText('This field is required')).toBeNull();
    fireEvent.click(screen.getByText('Send'));
    expect(onSubmit).toHaveBeenCalledWith({ country: 'us' }, expect.any(Array));
  });
});
