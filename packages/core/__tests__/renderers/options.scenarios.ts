import type { FormDefinition } from '../../src';
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

export function optionScenarios(harness: RendererHarness, { it, expect, waitFor, fn }: TestKit): void {
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
}
