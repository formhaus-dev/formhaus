import { fireEvent, render, screen } from '@testing-library/vue';
import { parseDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import invoiceJson from '../../../docs/recipes/definitions/invoice.json';
import FormRenderer from '../src/FormRenderer.vue';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';
import type { FormRendererHandle } from '../src/types';

const invoice = parseDefinition(invoiceJson);
const input = (name: string) => screen.getByLabelText(new RegExp(`^${name}`)) as HTMLInputElement;

function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

type Line = { quantity?: number | null; price?: number | null };

const Invoice = defineComponent({
  setup() {
    const form = ref<FormRendererHandle>();
    let dueDateEdited = false;
    function onFieldChange(key: string, value: unknown) {
      if (key === 'dueDate') dueDateEdited = true;
      if (key === 'issueDate' && !dueDateEdited && typeof value === 'string' && value) form.value?.setValue('dueDate', addDays(value, 14));
    }
    const amount = computed(() =>
      ((form.value?.values.lines as Line[] | undefined) ?? []).reduce((sum, line) => sum + (line.quantity ?? 0) * (line.price ?? 0), 0),
    );
    return () => [
      h(FormRenderer, { ref: form, definition: invoice, onFieldChange }),
      h('p', { 'data-testid': 'total' }, amount.value.toFixed(2)),
    ];
  },
});

describe('renderer handle', () => {
  it('sets values and reads them without emitting fieldChange', async () => {
    const handle = ref<FormRendererHandle>();
    const onFieldChange = vi.fn();
    const Host = defineComponent({ setup: () => () => h(HeadlessFormRenderer, { ref: handle, definition: invoice, onFieldChange }) });
    render(Host);
    handle.value!.setValue('client', 'Acme');
    const values = handle.value!.getValues();
    values.client = 'changed';
    expect(handle.value!.getValues().client).toBe('Acme');
    expect(onFieldChange).not.toHaveBeenCalled();
  });

  it('derives the due date from the issue date until the user edits it', async () => {
    render(Invoice);
    await fireEvent.update(input('Issue date'), '2026-03-01');
    expect(input('Due date').value).toBe('2026-03-15');
    await fireEvent.update(input('Issue date'), '2026-12-25');
    expect(input('Due date').value).toBe('2027-01-08');
    await fireEvent.update(input('Due date'), '2027-02-01');
    await fireEvent.update(input('Issue date'), '2027-01-10');
    expect(input('Due date').value).toBe('2027-02-01');
  });

  it('totals the invoice lines from the reactive handle values', async () => {
    render(Invoice);
    expect(screen.getByTestId('total').textContent).toBe('0.00');
    await fireEvent.update(input('Unit price'), '12.5');
    await fireEvent.update(input('Quantity'), '3');
    expect(screen.getByTestId('total').textContent).toBe('37.50');
  });
});
