import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FieldOption, FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
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
    const handle = mount({ optionsProviders: { regions: () => new Promise<FieldOption[]>((r) => (resolve = r)) } });
    await waitFor(() => expect(resolve).toBeDefined());
    handle.value!.setValue('region', 'us-east-1');
    await nextTick();
    resolve(regions);
    await waitFor(() => expect(input().value).toBe('US East (N. Virginia)'));
    expect(handle.value!.getValues().region).toBe('us-east-1');
  });

  it('shows the label when the value is set after the options load', async () => {
    const handle = mount({ optionsProviders: { regions: () => regions } });
    await waitFor(() => expect(listed()).toHaveLength(2));
    handle.value!.setValue('region', 'eu-west-1');
    await nextTick();
    expect(input().value).toBe('Europe (Ireland)');
  });

  it('shows the label for initialValues', async () => {
    mount({ initialValues: { region: 'us-east-1' }, optionsProviders: { regions: () => regions } });
    await waitFor(() => expect(input().value).toBe('US East (N. Virginia)'));
  });

  it('shows a value that matches no option as typed', async () => {
    const handle = mount({ optionsProviders: { regions: () => regions } });
    await waitFor(() => expect(listed()).toHaveLength(2));
    handle.value!.setValue('region', 'unknown-1');
    await nextTick();
    expect(input().value).toBe('unknown-1');
  });

  it('lists labels and stores the value of a picked label', async () => {
    const onSubmit = vi.fn();
    mount({ optionsProviders: { regions: () => regions }, onSubmit });
    await waitFor(() => expect(listed()).toHaveLength(2));
    expect(listed()).toEqual(['US East (N. Virginia)', 'Europe (Ireland)']);
    await fireEvent.update(input(), 'US East (N. Virginia)');
    expect(input().value).toBe('US East (N. Virginia)');
    await fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ region: 'us-east-1' }, expect.any(Array)));
  });

  it('keeps typed text that equals an option value', async () => {
    const onSubmit = vi.fn();
    mount({ optionsProviders: { regions: () => regions }, onSubmit });
    await waitFor(() => expect(listed()).toHaveLength(2));
    await fireEvent.update(input(), 'us-east-1');
    expect(input().value).toBe('us-east-1');
    await fireEvent.click(screen.getByText('Save'));
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
    mount({ definition: cityForm, onSubmit });
    expect(listed()).toEqual(['Paris (paris-fr)', 'Paris (paris-tx)', 'Rome']);
    await fireEvent.update(city(), 'Paris (paris-tx)');
    expect(city().value).toBe('Paris (paris-tx)');
    await fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ city: 'paris-tx' }, expect.any(Array)));
  });

  it('shows the distinct text for setValue', async () => {
    const handle = mount({ definition: cityForm });
    handle.value!.setValue('city', 'paris-tx');
    await nextTick();
    expect(city().value).toBe('Paris (paris-tx)');
    handle.value!.setValue('city', 'paris-fr');
    await nextTick();
    expect(city().value).toBe('Paris (paris-fr)');
  });

  it('shows the distinct text for initialValues', async () => {
    mount({ definition: cityForm, initialValues: { city: 'paris-tx' } });
    await nextTick();
    expect(city().value).toBe('Paris (paris-tx)');
  });

  it('keeps a label that looks like a disambiguated text distinct', async () => {
    const onSubmit = vi.fn();
    const options = [...cities.slice(0, 2), { value: 'odd', label: 'Paris (paris-tx)' }];
    const form: FormDefinition = { ...cityForm, fields: [{ ...cityForm.fields![0], options } as never] };
    mount({ definition: form, onSubmit });
    expect(listed()).toEqual(['Paris (paris-fr)', 'Paris (paris-tx) (paris-tx)', 'Paris (paris-tx) (odd)']);
    await fireEvent.update(city(), 'Paris (paris-tx) (odd)');
    await fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ city: 'odd' }, expect.any(Array)));
  });
});
