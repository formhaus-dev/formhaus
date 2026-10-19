import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FieldOption, FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
import type { FormRendererHandle } from '../src/types';

const banks: FieldOption[] = [
  { value: '012', label: 'BBVA México' },
  { value: '002', label: 'Banamex' },
];

const definition: FormDefinition = {
  id: 'payout',
  title: 'Payout',
  submit: { label: 'Save' },
  fields: [{ key: 'bank', type: 'autocomplete', label: 'Bank', optionsFrom: 'banks' }],
};

const input = () => screen.getByRole('combobox', { name: /Bank/ }) as HTMLInputElement;
const listed = () => [...document.querySelectorAll('datalist option')].map((o) => o.getAttribute('value'));

function mount(props: Record<string, unknown>) {
  const handle = ref<FormRendererHandle>();
  const Host = defineComponent({ setup: () => () => h(FormRenderer, { ref: handle, definition, ...props }) });
  render(Host);
  return handle;
}

describe('autocomplete value and label', () => {
  it('shows the label when the value is set before the options load', async () => {
    let resolve!: (options: FieldOption[]) => void;
    const handle = mount({ optionsProviders: { banks: () => new Promise<FieldOption[]>((r) => (resolve = r)) } });
    await waitFor(() => expect(resolve).toBeDefined());
    handle.value!.setValue('bank', '012');
    await nextTick();
    resolve(banks);
    await waitFor(() => expect(input().value).toBe('BBVA México'));
    expect(handle.value!.getValues().bank).toBe('012');
  });

  it('shows the label when the value is set after the options load', async () => {
    const handle = mount({ optionsProviders: { banks: () => banks } });
    await waitFor(() => expect(listed()).toHaveLength(2));
    handle.value!.setValue('bank', '002');
    await nextTick();
    expect(input().value).toBe('Banamex');
  });

  it('shows the label for initialValues', async () => {
    mount({ initialValues: { bank: '012' }, optionsProviders: { banks: () => banks } });
    await waitFor(() => expect(input().value).toBe('BBVA México'));
  });

  it('shows a value that matches no option as typed', async () => {
    const handle = mount({ optionsProviders: { banks: () => banks } });
    await waitFor(() => expect(listed()).toHaveLength(2));
    handle.value!.setValue('bank', '999');
    await nextTick();
    expect(input().value).toBe('999');
  });

  it('lists labels and stores the value of a picked label', async () => {
    const onSubmit = vi.fn();
    mount({ optionsProviders: { banks: () => banks }, onSubmit });
    await waitFor(() => expect(listed()).toHaveLength(2));
    expect(listed()).toEqual(['BBVA México', 'Banamex']);
    await fireEvent.update(input(), 'BBVA México');
    expect(input().value).toBe('BBVA México');
    await fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ bank: '012' }, expect.any(Array)));
  });

  it('keeps typed text that equals an option value', async () => {
    const onSubmit = vi.fn();
    mount({ optionsProviders: { banks: () => banks }, onSubmit });
    await waitFor(() => expect(listed()).toHaveLength(2));
    await fireEvent.update(input(), '012');
    expect(input().value).toBe('012');
    await fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ bank: '012' }, expect.any(Array)));
  });
});
