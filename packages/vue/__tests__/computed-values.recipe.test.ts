import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { parseDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import bookingJson from '../../../docs/recipes/definitions/booking-total.json';
import FormRenderer from '../src/FormRenderer.vue';
import type { FormRendererHandle } from '../src/types';

const booking = parseDefinition(bookingJson);

const Booking = defineComponent({
  emits: ['done'],
  setup(_, { emit }) {
    const form = ref<FormRendererHandle>();
    function onValuesChange(values: Record<string, unknown>) {
      const total = String(Number(values.adults ?? 0) + Number(values.children ?? 0));
      if (values.total !== total) form.value?.setValue('total', total);
    }
    return () =>
      h(FormRenderer, {
        ref: form,
        definition: booking,
        onValuesChange,
        onSubmit: (values: Record<string, unknown>) => emit('done', values),
      });
  },
});

describe('computed values recipe', () => {
  it('recalls the computed total on the next step and branches on it', async () => {
    const { emitted } = render(Booking);
    await fireEvent.update(screen.getByLabelText(/^Adults/), '8');
    await fireEvent.update(screen.getByLabelText(/^Children/), '3');
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Booking for 11')).toBeTruthy();
    expect(screen.getByText('8 adults and 3 children.')).toBeTruthy();
    expect(screen.getByLabelText(/^Group request/)).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    await waitFor(() => expect(emitted().done).toBeTruthy());
    expect((emitted().done[0] as unknown[])[0]).toMatchObject({ total: '11' });
  });

  it('hides the branch below the threshold', async () => {
    render(Booking);
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Booking for 1')).toBeTruthy();
    expect(screen.queryByLabelText(/^Group request/)).toBeNull();
  });
});
