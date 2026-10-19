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

describe('autocomplete options with the same label', () => {
  const cities: FieldOption[] = [
    { value: 'paris-fr', label: 'Paris' },
    { value: 'paris-tx', label: 'Paris' },
    { value: 'rome', label: 'Rome' },
  ];
  const cityForm: FormDefinition = {
    id: 'trip',
    title: 'Trip',
    submit: { label: 'Save' },
    fields: [{ key: 'city', type: 'autocomplete', label: 'City', options: cities }],
  };
  const city = () => screen.getByRole('combobox', { name: /City/ }) as HTMLInputElement;

  it('lists a distinct text for each option and submits the picked one', async () => {
    const onSubmit = vi.fn();
    const { container } = render(<FormRenderer definition={cityForm} onSubmit={onSubmit} />);
    expect([...container.querySelectorAll('datalist option')].map((o) => o.getAttribute('value'))).toEqual([
      'Paris (paris-fr)',
      'Paris (paris-tx)',
      'Rome',
    ]);
    fireEvent.change(city(), { target: { value: 'Paris (paris-tx)' } });
    expect(city().value).toBe('Paris (paris-tx)');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ city: 'paris-tx' }, expect.any(Array)));
  });

  it('shows the distinct text for setValue', () => {
    const handle = createRef<FormRendererHandle>();
    render(<FormRenderer ref={handle} definition={cityForm} onSubmit={() => {}} />);
    act(() => handle.current!.setValue('city', 'paris-tx'));
    expect(city().value).toBe('Paris (paris-tx)');
    act(() => handle.current!.setValue('city', 'paris-fr'));
    expect(city().value).toBe('Paris (paris-fr)');
  });

  it('shows the distinct text for initialValues', () => {
    render(<FormRenderer definition={cityForm} initialValues={{ city: 'paris-tx' }} onSubmit={() => {}} />);
    expect(city().value).toBe('Paris (paris-tx)');
  });

  it('keeps a label that looks like a disambiguated text distinct', async () => {
    const onSubmit = vi.fn();
    const options = [...cities.slice(0, 2), { value: 'odd', label: 'Paris (paris-tx)' }];
    const form: FormDefinition = { ...cityForm, fields: [{ ...cityForm.fields![0], options } as never] };
    const { container } = render(<FormRenderer definition={form} onSubmit={onSubmit} />);
    expect([...container.querySelectorAll('datalist option')].map((o) => o.getAttribute('value'))).toEqual([
      'Paris (paris-fr)',
      'Paris (paris-tx) (paris-tx)',
      'Paris (paris-tx) (odd)',
    ]);
    fireEvent.change(city(), { target: { value: 'Paris (paris-tx) (odd)' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ city: 'odd' }, expect.any(Array)));
  });
});
