import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { FormField } from '@formhaus/core';
import { fieldProps, useFieldProps } from '../src/fieldProps';
import type { FieldComponentProps } from '../src/types';

const city: FormField = {
  key: 'city',
  type: 'autocomplete',
  label: 'City',
  options: [
    { value: 'de', label: 'Germany' },
    { value: 'nl', label: 'Netherlands' },
  ],
};

const props = (overrides: Partial<FieldComponentProps> = {}): FieldComponentProps => ({
  field: city,
  value: 'de',
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ...overrides,
});

describe('fieldProps', () => {
  it('gives loading beside disabled', () => {
    expect([fieldProps(props({ loading: true })).loading, fieldProps(props({ loading: true })).disabled]).toEqual([true, true]);
    expect([fieldProps(props({ disabled: true })).loading, fieldProps(props()).loading]).toEqual([false, false]);
  });

  it('gives free text from the value and saves option values', () => {
    const onChange = vi.fn();
    const f = fieldProps(props({ onChange }));
    expect(f.freeText.text).toBe('Germany');
    f.freeText.setText('Netherlands');
    f.freeText.setText('Paris');
    expect(onChange.mock.calls).toEqual([['nl'], ['Paris']]);
  });
});

describe('useFieldProps', () => {
  it('keeps typed text that gives the value', () => {
    const onChange = vi.fn();
    const { result, rerender } = renderHook((value: unknown) => useFieldProps(props({ value, onChange })), { initialProps: 'de' });
    act(() => result.current.freeText.setText('nl'));
    expect(onChange).toHaveBeenLastCalledWith('nl');
    rerender('nl');
    expect(result.current.freeText.text).toBe('nl');
    rerender('de');
    expect(result.current.freeText.text).toBe('Germany');
  });
});
