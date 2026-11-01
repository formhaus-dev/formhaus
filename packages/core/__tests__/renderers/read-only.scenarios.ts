import type { FormDefinition, FormField } from '@formhaus/core';
import type { RendererHarness, TestKit } from './fixtures';

const choices = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

const account = (readOnly: FormField['readOnly'] = true, formatVersion = '1.8'): FormDefinition => ({
  formatVersion,
  id: 'account',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'lock', type: 'checkbox', label: 'Lock' },
    { key: 'name', type: 'text', label: 'Name', readOnly, validation: { required: true, minLength: 10 } },
    { key: 'news', type: 'checkbox', label: 'News', readOnly },
    { key: 'plan', type: 'radio', label: 'Plan', readOnly, options: choices },
    { key: 'tier', type: 'select', label: 'Tier', readOnly, options: choices },
  ],
});

const stored = { name: 'Ada Lovelace', news: false, plan: 'a', tier: 'a' };

const crew: FormDefinition = {
  formatVersion: '1.8',
  id: 'crew',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'note', type: 'textarea', label: 'Note' },
    { key: 'people', type: 'group', label: 'People', reorderable: true, fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  ],
};

export function readOnlyScenarios(harness: RendererHarness, { it, expect, waitFor, fn, screen }: TestKit): void {
  const control = (role: string, name: string) => screen.getByRole(role, { name }) as HTMLInputElement;

  it('marks read-only controls without disabling them', () => {
    harness.mount({ definition: account(), initialValues: stored, onSubmit: fn() });
    const name = control('textbox', 'Name');
    expect([name.readOnly, name.disabled, name.hasAttribute('aria-readonly')]).toEqual([true, false, false]);
    expect([control('radiogroup', 'Plan').getAttribute('aria-readonly'), control('radio', 'Alpha').hasAttribute('aria-readonly')]).toEqual([
      'true',
      false,
    ]);
    for (const element of [control('checkbox', 'News'), control('combobox', 'Tier')]) {
      expect([element.getAttribute('aria-readonly'), (element as HTMLInputElement).disabled]).toEqual(['true', false]);
    }
    const tier = Array.from(control('combobox', 'Tier').querySelectorAll('option')).filter((item) => item.value);
    expect(tier.map((item) => item.disabled)).toEqual([false, true]);
  });

  it('ignores value changes and submits the stored values', async () => {
    const onSubmit = fn();
    harness.mount({ definition: account(), initialValues: stored, onSubmit });
    await harness.click(control('checkbox', 'News'));
    await harness.click(control('radio', 'Beta'));
    await harness.type(control('textbox', 'Name'), 'Bob');
    expect([control('checkbox', 'News').checked, control('radio', 'Beta').checked]).toEqual([false, false]);
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining(stored), []));
  });

  it('makes a field read-only while its conditions match', async () => {
    harness.mount({ definition: account([{ field: 'lock', eq: true }]), initialValues: stored, onSubmit: fn() });
    expect(control('textbox', 'Name').readOnly).toBe(false);
    await harness.click(control('checkbox', 'Lock'));
    await waitFor(() => expect(control('textbox', 'Name').readOnly).toBe(true));
    expect(control('radiogroup', 'Plan').getAttribute('aria-readonly')).toBe('true');
  });

  it('validates a read-only field like any other field', async () => {
    const onSubmit = fn();
    harness.mount({ definition: account(), initialValues: { ...stored, name: 'Ada' }, onSubmit });
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(control('textbox', 'Name').getAttribute('aria-invalid')).toBe('true'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('ignores readOnly below format 1.8', () => {
    harness.mount({ definition: account(true, '1.7'), initialValues: stored, onSubmit: fn() });
    expect(control('textbox', 'Name').readOnly).toBe(false);
    expect(control('checkbox', 'News').hasAttribute('aria-readonly')).toBe(false);
  });

  it('makes every field read-only and hides group buttons with the renderer readOnly prop', async () => {
    const onSubmit = fn();
    harness.mount({ definition: crew, readOnly: true, initialValues: { note: 'Hi', people: [{ name: 'Ada' }, { name: 'Bo' }] }, onSubmit });
    expect(control('textbox', 'Note').readOnly).toBe(true);
    expect(screen.getAllByRole('textbox', { name: 'Name' }).every((input) => (input as HTMLInputElement).readOnly)).toBe(true);
    expect(screen.queryAllByRole('button', { name: /Add|Remove|Move/ })).toEqual([]);
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ note: 'Hi', people: [{ name: 'Ada' }, { name: 'Bo' }] }, []));
  });
}
