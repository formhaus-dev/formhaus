import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FieldOption, FormDefinition } from '@formhaus/core';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';
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

function deferred() {
  let resolve!: (options: FieldOption[]) => void;
  const promise = new Promise<FieldOption[]>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('autocomplete value and label', () => {
  it('shows the label when the value is set before the options load', async () => {
    const pending = deferred();
    const handle = createRef<FormRendererHandle>();
    render(<FormRenderer ref={handle} definition={definition} optionsProviders={{ banks: () => pending.promise }} onSubmit={() => {}} />);
    act(() => handle.current!.setValue('bank', '012'));
    await act(async () => pending.resolve(banks));
    await waitFor(() => expect(input().value).toBe('BBVA México'));
    expect(handle.current!.getValues().bank).toBe('012');
  });

  it('shows the label when the value is set after the options load', async () => {
    const handle = createRef<FormRendererHandle>();
    const { container } = render(
      <FormRenderer ref={handle} definition={definition} optionsProviders={{ banks: () => banks }} onSubmit={() => {}} />,
    );
    await waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
    act(() => handle.current!.setValue('bank', '002'));
    expect(input().value).toBe('Banamex');
  });

  it('shows the label for initialValues', async () => {
    render(
      <FormRenderer
        definition={definition}
        initialValues={{ bank: '012' }}
        optionsProviders={{ banks: () => banks }}
        onSubmit={() => {}}
      />,
    );
    await waitFor(() => expect(input().value).toBe('BBVA México'));
  });

  it('shows a value that matches no option as typed', async () => {
    const handle = createRef<FormRendererHandle>();
    const { container } = render(
      <FormRenderer ref={handle} definition={definition} optionsProviders={{ banks: () => banks }} onSubmit={() => {}} />,
    );
    await waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
    act(() => handle.current!.setValue('bank', '999'));
    expect(input().value).toBe('999');
  });

  it('lists labels and stores the value of a picked label', async () => {
    const onSubmit = vi.fn();
    const { container } = render(<FormRenderer definition={definition} optionsProviders={{ banks: () => banks }} onSubmit={onSubmit} />);
    await waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
    expect([...container.querySelectorAll('datalist option')].map((o) => o.getAttribute('value'))).toEqual(['BBVA México', 'Banamex']);
    fireEvent.change(input(), { target: { value: 'BBVA México' } });
    expect(input().value).toBe('BBVA México');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ bank: '012' }, expect.any(Array)));
  });

  it('keeps typed text that equals an option value', async () => {
    const onSubmit = vi.fn();
    const { container } = render(<FormRenderer definition={definition} optionsProviders={{ banks: () => banks }} onSubmit={onSubmit} />);
    await waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
    fireEvent.change(input(), { target: { value: '012' } });
    expect(input().value).toBe('012');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ bank: '012' }, expect.any(Array)));
  });
});
