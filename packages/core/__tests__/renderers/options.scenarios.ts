import type { FieldOption, FormDefinition, FormField } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const remote = (from: string): FormDefinition => ({
  id: 'travel',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'city', type: 'select', label: 'City', optionsFrom: from }],
});

const fixed: FormDefinition = {
  id: 'travel',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'city', type: 'select', label: 'City', options: [{ value: 'rome', label: 'Rome' }] }],
};

const choice = (label: string, source: Partial<FormField>): FormField => ({ key: 'choice', type: 'select', label, ...source });

const scoped = (billing: Partial<FormField>): FormDefinition => ({
  formatVersion: '1.1',
  id: 'orders',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'billing', type: 'group', label: 'Billing', fields: [choice('Billing choice', billing)] },
    { key: 'shipping', type: 'group', label: 'Shipping', fields: [choice('Shipping choice', { optionsFrom: 'ship' })] },
  ],
});

const deferred = () => {
  let resolve: (options: FieldOption[]) => void = () => {};
  const promise = new Promise<FieldOption[]>((done) => (resolve = done));
  return { provider: () => promise, resolve };
};

export function optionScenarios(harness: RendererHarness, { it, expect, waitFor, fn, screen }: TestKit): void {
  const labels = () => [...document.querySelectorAll('option')].map((option) => option.textContent?.trim()).filter(Boolean);
  const oslo = () => [{ value: 'oslo', label: 'Oslo' }];
  const paris = () => [{ value: 'paris', label: 'Paris' }];

  it('uses the new options providers when they are replaced', async () => {
    const mounted = harness.mount({ definition: remote('cities'), optionsProviders: { cities: oslo }, onSubmit: fn() });
    await waitFor(() => expect(labels()).toContain('Oslo'));
    await mounted.update({ optionsProviders: { cities: paris } });
    await waitFor(() => expect(labels()).toContain('Paris'));
    expect(labels()).not.toContain('Oslo');
  });

  it('drops resolved options when the new definition lists its own options', async () => {
    const mounted = harness.mount({ definition: remote('cities'), optionsProviders: { cities: oslo }, onSubmit: fn() });
    await waitFor(() => expect(labels()).toContain('Oslo'));
    await mounted.update({ definition: fixed });
    await waitFor(() => expect(labels()).toContain('Rome'));
    expect(labels()).not.toContain('Oslo');
  });

  it('resolves a provider that only the new definition names', async () => {
    const mounted = harness.mount({ definition: remote('cities'), optionsProviders: { cities: oslo, towns: paris }, onSubmit: fn() });
    await waitFor(() => expect(labels()).toContain('Oslo'));
    await mounted.update({ definition: remote('towns') });
    await waitFor(() => expect(labels()).toContain('Paris'));
    expect(labels()).not.toContain('Oslo');
  });

  it('starts resolving when providers arrive after mount', async () => {
    const mounted = harness.mount({ definition: remote('cities'), onSubmit: fn() });
    await mounted.update({ optionsProviders: { cities: oslo } });
    await waitFor(() => expect(labels()).toContain('Oslo'));
  });

  it('falls back to the field options when its provider is removed', async () => {
    const definition: FormDefinition = { ...fixed, fields: [{ ...fixed.fields![0], optionsFrom: 'cities' }] };
    const mounted = harness.mount({ definition, optionsProviders: { cities: oslo }, onSubmit: fn() });
    await waitFor(() => expect(labels()).toContain('Oslo'));
    await mounted.update({ optionsProviders: {} });
    await waitFor(() => expect(labels()).toContain('Rome'));
    expect(labels()).not.toContain('Oslo');
  });

  const optionsOf = (name: string) =>
    [...(screen.getByRole('combobox', { name }) as HTMLSelectElement).options].map((option) => option.textContent?.trim()).filter(Boolean);
  const option = (label: string) => [{ value: label.toLowerCase(), label }];
  const settled = async (billing: string) => {
    await waitFor(() => expect(optionsOf('Shipping choice')).toEqual(['Ship']));
    await waitFor(() => expect(optionsOf('Billing choice')).toEqual([billing]));
  };
  const items = { billing: [{}], shipping: [{}] };

  it('keeps the options of a field key shared by two groups apart', async () => {
    const optionsProviders = { bill: () => option('Bill'), ship: () => option('Ship') };
    harness.mount({ definition: scoped({ optionsFrom: 'bill' }), initialValues: items, optionsProviders, onSubmit: fn() });
    await settled('Bill');
  });

  it('keeps the static options of a group field when another group loads the same key', async () => {
    const optionsProviders = { ship: () => option('Ship') };
    harness.mount({ definition: scoped({ options: option('Fixed') }), initialValues: items, optionsProviders, onSubmit: fn() });
    await settled('Fixed');
  });

  it.each([
    ['billing first', true],
    ['shipping first', false],
  ])('keeps async options of shared group keys apart when %s', async (_, billingFirst) => {
    const bill = deferred();
    const ship = deferred();
    const optionsProviders = { bill: bill.provider, ship: ship.provider };
    harness.mount({ definition: scoped({ optionsFrom: 'bill' }), initialValues: items, optionsProviders, onSubmit: fn() });
    const order = billingFirst
      ? [() => bill.resolve(option('Bill')), () => ship.resolve(option('Ship'))]
      : [() => ship.resolve(option('Ship')), () => bill.resolve(option('Bill'))];
    for (const resolve of order) {
      resolve();
      await Promise.resolve();
    }
    await settled('Bill');
  });
}
