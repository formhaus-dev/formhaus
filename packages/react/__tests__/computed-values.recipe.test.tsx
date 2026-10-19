import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { parseDefinition } from '@formhaus/core';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import bookingJson from '../../../docs/recipes/definitions/booking-total.json';
import { FormRenderer, type FormRendererHandle } from '../src';

const booking = parseDefinition(bookingJson);

function BookingForm({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  const form = useRef<FormRendererHandle>(null);
  return (
    <FormRenderer
      ref={form}
      definition={booking}
      onSubmit={onDone}
      onValuesChange={(values) => {
        const total = String(Number(values.adults ?? 0) + Number(values.children ?? 0));
        if (values.total !== total) form.current?.setValue('total', total);
      }}
    />
  );
}

describe('computed values recipe', () => {
  it('recalls the computed total on the next step and branches on it', async () => {
    const onDone = vi.fn();
    render(<BookingForm onDone={onDone} />);
    fireEvent.change(screen.getByLabelText(/^Adults/), { target: { value: '8' } });
    fireEvent.change(screen.getByLabelText(/^Children/), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Booking for 11')).toBeTruthy();
    expect(screen.getByText('8 adults and 3 children.')).toBeTruthy();
    expect(screen.getByLabelText(/^Group request/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Book' }));
    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(onDone.mock.calls[0][0]).toMatchObject({ total: '11' });
  });

  it('hides the branch below the threshold', async () => {
    render(<BookingForm onDone={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Booking for 1')).toBeTruthy();
    expect(screen.queryByLabelText(/^Group request/)).toBeNull();
  });
});
