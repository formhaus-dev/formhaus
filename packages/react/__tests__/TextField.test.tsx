import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import type { FormField } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../src/fields/TextField';

const field: FormField = {
  key: 'age',
  type: 'number',
  label: 'Age',
};

function ControlledNumber({ onValue }: { onValue: (value: unknown) => void }) {
  const [value, setValue] = useState<unknown>(undefined);
  return (
    <TextField
      field={field}
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue(next);
      }}
      onBlur={() => {}}
    />
  );
}

function typeSequence(input: HTMLElement, steps: string[]) {
  return steps.map((step) => {
    fireEvent.change(input, { target: { value: step } });
    return (input as HTMLInputElement).value;
  });
}

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

  it.each([
    [['1', '1.0', '1.05'], 1.05],
    [['2', '2.5', '2.50'], 2.5],
    [['1', '10', '10.0'], 10],
    [['-0', '-0.5'], -0.5],
    [['1.05', '1.0', '1.05'], 1.05],
  ])('keeps typed number text %j', (steps, expected) => {
    const onValue = vi.fn();
    render(<ControlledNumber onValue={onValue} />);

    const shown = typeSequence(screen.getByRole('spinbutton', { name: 'Age' }), steps);

    expect(shown).toEqual(steps);
    expect(onValue).toHaveBeenLastCalledWith(expected);
  });

  it('shows a value set from outside', () => {
    const { rerender } = render(<TextField field={field} value={1} onChange={() => {}} onBlur={() => {}} />);
    const input = screen.getByRole('spinbutton', { name: 'Age' });
    fireEvent.change(input, { target: { value: '1.0' } });

    rerender(<TextField field={field} value={7} onChange={() => {}} onBlur={() => {}} />);

    expect(input).toHaveProperty('value', '7');
  });

  it('drops the minus sign when zero is set from outside', () => {
    const { rerender } = render(<TextField field={field} value={-0} onChange={() => {}} onBlur={() => {}} />);
    const input = screen.getByRole('spinbutton', { name: 'Age' });
    fireEvent.change(input, { target: { value: '-0' } });

    rerender(<TextField field={field} value={0} onChange={() => {}} onBlur={() => {}} />);

    expect(input).toHaveProperty('value', '0');
  });

  it('passes inputMode to the input', () => {
    render(
      <TextField
        field={{ key: 'site', type: 'text', label: 'Site', inputMode: 'url' }}
        value=""
        onChange={() => {}}
        onBlur={() => {}}
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Site' }).getAttribute('inputmode')).toBe('url');
  });
});
