import { describe, expect, it, vi } from 'vitest';
import { nextTick, reactive } from 'vue';
import type { FormField } from '@formhaus/core';
import { type FieldEmit, useFieldProps } from '../src/composables/useFieldProps';
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

const setup = (overrides: Partial<FieldComponentProps> = {}) => {
  const props = reactive<FieldComponentProps>({ field: city, modelValue: 'de', ...overrides });
  const emit = vi.fn();
  return { props, emit, f: useFieldProps(props, emit as unknown as FieldEmit) };
};

describe('useFieldProps', () => {
  it('gives loading beside disabled', () => {
    const { props, f } = setup({ loading: true });
    expect([f.loading, f.disabled]).toEqual([true, true]);
    props.loading = false;
    props.disabled = true;
    expect([f.loading, f.disabled]).toEqual([false, true]);
  });

  it('keeps typed text that gives the value and saves option values', async () => {
    const { props, emit, f } = setup();
    expect(f.freeText.text).toBe('Germany');
    f.freeText.setText('nl');
    f.freeText.setText('Netherlands');
    expect(emit.mock.calls).toEqual([
      ['update:modelValue', 'nl'],
      ['update:modelValue', 'nl'],
    ]);
    f.freeText.setText('nl');
    props.modelValue = 'nl';
    await nextTick();
    expect(f.freeText.text).toBe('nl');
    props.modelValue = 'de';
    expect(f.freeText.text).toBe('Germany');
  });
});
