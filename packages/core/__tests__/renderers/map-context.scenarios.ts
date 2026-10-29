import type { FieldOption, FormDefinition } from '../../src';
import { deferred, type RendererHarness, type TestKit } from './fixtures';

const cities: FieldOption[] = [
  { value: 'de', label: 'Germany' },
  { value: 'nl', label: 'Netherlands' },
];

const definition: FormDefinition = {
  id: 'context',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'size', type: 'radio', label: 'Size', layout: 'inline', options: [{ value: 's', label: 'S' }] },
    {
      key: 'mood',
      type: 'scale',
      label: 'Mood',
      validation: { min: 1, max: 3 },
      options: [
        { value: '1', label: 'Sad' },
        { value: '3', label: 'Happy' },
      ],
    },
    { key: 'city', type: 'select', label: 'City', optionsFrom: 'cities' },
  ],
};

const typed: FormDefinition = {
  id: 'typed',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'city', type: 'autocomplete', label: 'City', optionsFrom: 'cities' }],
};

export function mapContextScenarios(harness: RendererHarness, { it, expect, fn, waitFor, screen }: TestKit): void {
  const send = () => harness.click(screen.getByRole('button', { name: 'Send' }));
  const input = (name: string) => screen.getByRole('group', { name }).querySelector('input')!;

  it('gives control props the kind, the field and the scale anchors', () => {
    harness.mount({ definition, components: harness.mapped!.context, optionsProviders: { cities: () => cities }, onSubmit: fn() });
    expect(input('Size').getAttribute('placeholder')).toBe('group inline');
    expect(input('Mood').getAttribute('placeholder')).toBe('Sad||Happy');
  });

  it('gives control props loading while the options load and keeps disabled', async () => {
    const pending = deferred<FieldOption[]>();
    harness.mount({ definition, components: harness.mapped!.context, optionsProviders: { cities: () => pending.promise }, onSubmit: fn() });
    const city = screen.getByRole('textbox', { name: 'City' });
    await waitFor(() => expect([city.title, (city as HTMLInputElement).disabled]).toEqual(['busy', true]));
    pending.resolve(cities);
    await waitFor(() => expect([city.title, (city as HTMLInputElement).disabled]).toEqual(['idle', false]));
  });

  it('marks a hand-written field busy while its options load', async () => {
    const pending = deferred<FieldOption[]>();
    harness.mount({ definition: typed, components: harness.views, optionsProviders: { cities: () => pending.promise }, onSubmit: fn() });
    const city = screen.getByRole('combobox', { name: 'City' });
    await waitFor(() => expect(city.getAttribute('aria-busy')).toBe('true'));
    pending.resolve(cities);
    await waitFor(() => expect(city.hasAttribute('aria-busy')).toBe(false));
  });

  it('keeps typed text in a hand-written field and saves option values', async () => {
    const onSubmit = fn();
    harness.mount({
      definition: typed,
      components: harness.views,
      initialValues: { city: 'de' },
      optionsProviders: { cities: () => cities },
      onSubmit,
    });
    const city = screen.getByRole('combobox', { name: 'City' }) as HTMLInputElement;
    await waitFor(() => expect(city.value).toBe('Germany'));
    await harness.type(city, 'nl');
    await waitFor(() => expect(city.value).toBe('nl'));
    await send();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].city).toBe('nl');
    await harness.type(city, 'Netherlands');
    await waitFor(() => expect(city.value).toBe('Netherlands'));
    await harness.type(city, 'Paris');
    await waitFor(() => expect(city.value).toBe('Paris'));
    await send();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[1][0].city).toBe('Paris');
  });

  it.each([
    ['a hand-written field', () => harness.views],
    ['a mapped control', () => harness.mapped!.typed],
    ['the built-in field', () => undefined],
  ])('saves the option of a same-label text in %s', async (_, components) => {
    const onSubmit = fn();
    const options: FieldOption[] = [
      { value: 'ny', label: 'Paris' },
      { value: 'fr', label: 'Paris' },
    ];
    const definition: FormDefinition = { ...typed, fields: [{ key: 'city', type: 'autocomplete', label: 'City', options }] };
    harness.mount({ definition, components: components(), onSubmit });
    const city = (screen.queryByRole('combobox', { name: 'City' }) ?? screen.getByRole('textbox', { name: 'City' })) as HTMLInputElement;
    await harness.type(city, 'Paris (fr)');
    await waitFor(() => expect(city.value).toBe('Paris (fr)'));
    await send();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].city).toBe('fr');
  });
}
