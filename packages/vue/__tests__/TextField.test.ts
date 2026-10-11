import { fireEvent, render, screen } from '@testing-library/vue';
import type { FormField } from '@formhaus/core';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import TextField from '../src/fields/TextField.vue';

const field: FormField = {
  key: 'age',
  type: 'number',
  label: 'Age',
};

const ControlledNumber = defineComponent(() => {
  const value = ref<unknown>(undefined);
  return () => h(TextField, { field, value: value.value, 'onUpdate:value': (next: unknown) => (value.value = next) });
});

describe('TextField', () => {
  it('keeps an empty number input empty', async () => {
    const { emitted } = render(TextField, { props: { field, value: 42 } });

    await fireEvent.update(screen.getByRole('spinbutton', { name: 'Age' }), '');

    expect(emitted()['update:value']).toEqual([['']]);
  });

  it.each([
    [['1', '1.0', '1.05']],
    [['2', '2.5', '2.50']],
    [['-0', '-0.5']],
    [['1.05', '1.0', '1.05']],
  ])('keeps typed number text %j', async (steps) => {
    render(ControlledNumber);
    const input = screen.getByRole('spinbutton', { name: 'Age' }) as HTMLInputElement;

    const shown: string[] = [];
    for (const step of steps) {
      await fireEvent.update(input, step);
      shown.push(input.value);
    }

    expect(shown).toEqual(steps);
  });
});
