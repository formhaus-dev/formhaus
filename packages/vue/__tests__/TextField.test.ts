import { fireEvent, render, screen } from '@testing-library/vue';
import type { FormField } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import TextField from '../src/fields/TextField.vue';

const field: FormField = {
  key: 'age',
  type: 'number',
  label: 'Age',
};

describe('TextField', () => {
  it('keeps an empty number input empty', async () => {
    const { emitted } = render(TextField, { props: { field, value: 42 } });

    await fireEvent.update(screen.getByRole('spinbutton', { name: 'Age' }), '');

    expect(emitted()['update:value']).toEqual([['']]);
  });
});
