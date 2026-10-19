import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FieldOption, FormDefinition } from '@formhaus/core';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';
import type { FormRendererHandle } from '../src/types';

const regions: FieldOption[] = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
];

const definition: FormDefinition = {
  id: 'deploy',
  title: 'Deploy',
  submit: { label: 'Save' },
  fields: [{ key: 'region', type: 'autocomplete', label: 'Region', optionsFrom: 'regions' }],
};

const input = () => screen.getByRole('combobox', { name: /Region/ }) as HTMLInputElement;

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
    render(<FormRenderer ref={handle} definition={definition} optionsProviders={{ regions: () => pending.promise }} onSubmit={() => {}} />);
    act(() => handle.current!.setValue('region', 'us-east-1'));
    await act(async () => pending.resolve(regions));
    await waitFor(() => expect(input().value).toBe('US East (N. Virginia)'));
    expect(handle.current!.getValues().region).toBe('us-east-1');
  });

  it('shows the label when the value is set after the options load', async () => {
    const handle = createRef<FormRendererHandle>();
    const { container } = render(
      <FormRenderer ref={handle} definition={definition} optionsProviders={{ regions: () => regions }} onSubmit={() => {}} />,
    );
    await waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
    act(() => handle.current!.setValue('region', 'eu-west-1'));
    expect(input().value).toBe('Europe (Ireland)');
  });

  it('shows the label for initialValues', async () => {
    render(
      <FormRenderer
        definition={definition}
        initialValues={{ region: 'us-east-1' }}
        optionsProviders={{ regions: () => regions }}
        onSubmit={() => {}}
      />,
    );
    await waitFor(() => expect(input().value).toBe('US East (N. Virginia)'));
  });

  it('shows a value that matches no option as typed', async () => {
    const handle = createRef<FormRendererHandle>();
    const { container } = render(
      <FormRenderer ref={handle} definition={definition} optionsProviders={{ regions: () => regions }} onSubmit={() => {}} />,
    );
    await waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
    act(() => handle.current!.setValue('region', 'unknown-1'));
    expect(input().value).toBe('unknown-1');
  });

  it('lists labels and stores the value of a picked label', async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <FormRenderer definition={definition} optionsProviders={{ regions: () => regions }} onSubmit={onSubmit} />,
    );
    await waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
    expect([...container.querySelectorAll('datalist option')].map((o) => o.getAttribute('value'))).toEqual([
      'US East (N. Virginia)',
      'Europe (Ireland)',
    ]);
    fireEvent.change(input(), { target: { value: 'US East (N. Virginia)' } });
    expect(input().value).toBe('US East (N. Virginia)');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ region: 'us-east-1' }, expect.any(Array)));
  });

  it('keeps typed text that equals an option value', async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <FormRenderer definition={definition} optionsProviders={{ regions: () => regions }} onSubmit={onSubmit} />,
    );
    await waitFor(() => expect(container.querySelectorAll('datalist option')).toHaveLength(2));
    fireEvent.change(input(), { target: { value: 'us-east-1' } });
    expect(input().value).toBe('us-east-1');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ region: 'us-east-1' }, expect.any(Array)));
  });
});
