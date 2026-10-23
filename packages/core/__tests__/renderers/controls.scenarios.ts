import type { FieldOption, FormDefinition, FormField } from '../../src';
import { deferred, type RendererHarness, type TestKit } from './fixtures';

const custom = (type: string, label: string, source: Partial<FormField> = {}): FormField => ({
  key: label.toLowerCase(),
  type,
  label,
  ...source,
});

const single = (control: FormField): FormDefinition => ({
  id: 'controls',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { ...control, validation: { required: true } },
  ],
});

const grouped = (control: FormField): FormDefinition => ({
  formatVersion: '1.1',
  id: 'controls',
  title: '',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'rows',
      type: 'group',
      label: 'Rows',
      addLabel: 'Add row',
      defaultItems: 1,
      fields: [control],
    },
  ],
});

export function controlScenarios(harness: RendererHarness, { it, expect, waitFor, screen }: TestKit): void {
  const components = harness.controls;
  const active = () => document.activeElement;
  const controls = (label: string) => [...document.querySelectorAll(`[aria-label="${label}"]`)];
  const knob = custom('x-knob', 'Knob');
  const dial = custom('x-dial', 'Dial');
  const city = custom('select', 'City', { optionsFrom: 'cities' });

  it.each([
    ['a tabindex control', knob],
    ['a slider after a disabled control', dial],
  ])('focuses %s of a custom field after a failed Submit', async (_, control) => {
    harness.mount({ definition: single(control), components, onSubmit: () => {} });
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(active()).toBe(controls(control.label!)[0]));
  });

  it.each([
    ['a tabindex control', knob],
    ['a slider after a disabled control', dial],
  ])('focuses %s of a custom field in an added group item', async (_, control) => {
    harness.mount({ definition: grouped({ ...control, key: 'control' }), components, onSubmit: () => {} });
    await harness.click(screen.getByRole('button', { name: 'Add row' }));
    await waitFor(() => expect(controls(control.label!)).toHaveLength(2));
    await waitFor(() => expect(active()).toBe(controls(control.label!)[1]));
  });

  it('passes loading to a custom field while its options load', async () => {
    const pending = deferred<FieldOption[]>();
    const definition: FormDefinition = { ...single(knob), fields: [{ ...knob, optionsFrom: 'knobs' }] };
    harness.mount({ definition, components, optionsProviders: { knobs: () => pending.promise }, onSubmit: () => {} });
    await waitFor(() => expect(controls('Knob')[0].hasAttribute('data-loading')).toBe(true));
    pending.resolve([{ value: 'a', label: 'A' }]);
    await waitFor(() => expect(controls('Knob')[0].hasAttribute('data-loading')).toBe(false));
  });

  it('passes loading to the custom field of every group item while its options load', async () => {
    const pending = deferred<FieldOption[]>();
    const definition = grouped({ ...knob, key: 'control', optionsFrom: 'knobs' });
    harness.mount({
      definition,
      components,
      initialValues: { rows: [{}, {}] },
      optionsProviders: { knobs: () => pending.promise },
      onSubmit: () => {},
    });
    await waitFor(() => expect(controls('Knob').map((item) => item.hasAttribute('data-loading'))).toEqual([true, true]));
    pending.resolve([{ value: 'a', label: 'A' }]);
    await waitFor(() => expect(controls('Knob').map((item) => item.hasAttribute('data-loading'))).toEqual([false, false]));
  });

  it.each([
    ['a field', single(city)],
    ['a group item field', grouped({ ...city, key: 'place' })],
  ])('keeps a built-in select of %s enabled and marks it busy while its options load', async (_, definition) => {
    const pending = deferred<FieldOption[]>();
    harness.mount({ definition, optionsProviders: { cities: () => pending.promise }, onSubmit: () => {} });
    const select = () => screen.getByRole('combobox', { name: /City/ }) as HTMLSelectElement;
    await waitFor(() => expect(select().closest('[aria-busy="true"]')).not.toBeNull());
    expect(select().disabled).toBe(false);
    pending.resolve([{ value: 'oslo', label: 'Oslo' }]);
    await waitFor(() => expect(select().closest('[aria-busy="true"]')).toBeNull());
    expect([...select().options].map((option) => option.value)).toContain('oslo');
  });
}
