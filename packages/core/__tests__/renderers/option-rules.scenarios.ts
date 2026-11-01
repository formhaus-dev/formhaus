import type { FormDefinition } from '@formhaus/core';
import type { RendererHarness, TestKit } from './fixtures';

const plans = (formatVersion: string, type = 'radio'): FormDefinition => ({
  formatVersion,
  id: 'plans',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'team', type: 'checkbox', label: 'Team' },
    {
      key: 'plan',
      type,
      label: 'Plan',
      options: [
        { value: 'free', label: 'Free', description: 'For one person' },
        { value: 'pro', label: 'Pro', disabled: true },
        { value: 'team', label: 'Team plan', disabled: [{ field: 'team', neq: true }] },
      ],
    },
  ],
});

export function optionRuleScenarios(harness: RendererHarness, { it, expect, waitFor, fn, screen }: TestKit): void {
  const option = (name: string, role = 'radio') => screen.getByRole(role, { name }) as HTMLInputElement;

  for (const [type, role] of [
    ['radio', 'radio'],
    ['multiselect', 'checkbox'],
  ]) {
    it(`describes a ${type} option with its description`, () => {
      harness.mount({ definition: plans('1.8', type), onSubmit: fn() });
      const free = option('Free', role);
      const description = document.getElementById(free.getAttribute('aria-describedby')!);
      expect(description?.textContent).toBe('For one person');
      expect(description?.classList.contains('fh-field__option-description')).toBe(true);
      expect(option('Team plan', role).hasAttribute('aria-describedby')).toBe(false);
    });

    it(`disables ${type} options for good and by condition`, async () => {
      harness.mount({ definition: plans('1.8', type), onSubmit: fn() });
      expect([option('Free', role).disabled, option('Pro', role).disabled, option('Team plan', role).disabled]).toEqual([
        false,
        true,
        true,
      ]);
      await harness.click(screen.getByRole('checkbox', { name: 'Team' }));
      await waitFor(() => expect(option('Team plan', role).disabled).toBe(false));
      expect(option('Pro', role).disabled).toBe(true);
    });
  }

  it('disables select options', () => {
    harness.mount({ definition: plans('1.8', 'select'), onSubmit: fn() });
    const options = Array.from(screen.getByRole('combobox', { name: 'Plan' }).querySelectorAll('option')).filter((item) => item.value);
    expect(options.map((item) => item.disabled)).toEqual([false, true, true]);
  });

  it('keeps a stored answer that holds a disabled option', async () => {
    const onSubmit = fn();
    harness.mount({ definition: plans('1.8'), initialValues: { plan: 'pro' }, onSubmit });
    expect(option('Pro').checked).toBe(true);
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ plan: 'pro' }), []));
  });

  it('ignores descriptions and disabled options below format 1.8', () => {
    harness.mount({ definition: plans('1.7'), onSubmit: fn() });
    expect(option('Free').hasAttribute('aria-describedby')).toBe(false);
    expect(document.querySelector('.fh-field__option-description')).toBeNull();
    expect([option('Pro').disabled, option('Team plan').disabled]).toEqual([false, false]);
  });
}
