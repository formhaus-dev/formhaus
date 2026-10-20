import { fireEvent, render, screen } from '@testing-library/react';
import { parseDefinition } from '@formhaus/core';
import { createRef, useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import invoiceJson from '../../../docs/recipes/definitions/invoice.json';
import { FormRenderer, type FormRendererHandle, HeadlessFormRenderer } from '../src';

const invoice = parseDefinition(invoiceJson);
const input = (name: string) => screen.getByLabelText(new RegExp(`^${name}`)) as HTMLInputElement;

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

type Line = { quantity?: number | null; price?: number | null };

function total(lines: unknown) {
  return ((lines as Line[] | undefined) ?? []).reduce((sum, line) => sum + (line.quantity ?? 0) * (line.price ?? 0), 0);
}

function Invoice({ onSubmit }: { onSubmit: (values: Record<string, unknown>) => void }) {
  const form = useRef<FormRendererHandle>(null);
  const dueDateEdited = useRef(false);
  const [amount, setAmount] = useState(0);
  return (
    <>
      <FormRenderer
        ref={form}
        definition={invoice}
        onSubmit={onSubmit}
        onValuesChange={(values) => setAmount(total(values.lines))}
        onFieldChange={(key, value) => {
          if (key === 'dueDate') dueDateEdited.current = true;
          if (key === 'issueDate' && !dueDateEdited.current && typeof value === 'string' && value)
            form.current?.setValue('dueDate', addDays(value, 14));
        }}
      />
      <p data-testid="total">{amount.toFixed(2)}</p>
    </>
  );
}

describe('renderer handle', () => {
  it('sets values and reads them without calling onFieldChange', () => {
    const handle = createRef<FormRendererHandle>();
    const onFieldChange = vi.fn();
    render(<HeadlessFormRenderer ref={handle} definition={invoice} onSubmit={() => {}} onFieldChange={onFieldChange} />);
    handle.current!.setValue('client', 'Acme');
    const values = handle.current!.getValues();
    values.client = 'changed';
    expect(handle.current!.getValues().client).toBe('Acme');
    expect(onFieldChange).not.toHaveBeenCalled();
  });

  it('reads the current values from the values property', () => {
    const handle = createRef<FormRendererHandle>();
    render(<FormRenderer ref={handle} definition={invoice} onSubmit={() => {}} />);
    handle.current!.setValue('client', 'Acme');
    expect(handle.current!.values.client).toBe('Acme');
  });

  it('derives the due date from the issue date until the user edits it', () => {
    const onSubmit = vi.fn();
    render(<Invoice onSubmit={onSubmit} />);
    fireEvent.change(input('Issue date'), { target: { value: '2026-03-01' } });
    expect(input('Due date').value).toBe('2026-03-15');
    fireEvent.change(input('Issue date'), { target: { value: '2026-12-25' } });
    expect(input('Due date').value).toBe('2027-01-08');
    fireEvent.change(input('Due date'), { target: { value: '2027-02-01' } });
    fireEvent.change(input('Issue date'), { target: { value: '2027-01-10' } });
    expect(input('Due date').value).toBe('2027-02-01');
  });

  it('totals the invoice lines on every value change', () => {
    render(<Invoice onSubmit={() => {}} />);
    expect(screen.getByTestId('total').textContent).toBe('0.00');
    fireEvent.change(input('Unit price'), { target: { value: '12.5' } });
    fireEvent.change(input('Quantity'), { target: { value: '3' } });
    expect(screen.getByTestId('total').textContent).toBe('37.50');
  });
});
