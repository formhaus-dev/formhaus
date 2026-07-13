import { fireEvent, render, screen } from '@testing-library/react';
import type { FormField } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../src/fields/TextField';

const field: FormField = {
  key: 'age',
  type: 'number',
  label: 'Age',
};

describe('TextField', () => {
  it('keeps an empty number input empty', () => {
    const onChange = vi.fn();
    render(
      <TextField
        field={field}
        value={42}
        onChange={onChange}
        onBlur={() => {}}
      />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Age' }), {
      target: { value: '' },
    });

    expect(onChange).toHaveBeenCalledWith('');
  });
});
