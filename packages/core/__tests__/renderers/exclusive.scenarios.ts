import type { FieldOption, FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const options: FieldOption[] = [
  { value: 'asthma', label: 'Asthma' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'none', label: 'None of these', exclusive: true },
  { value: 'private', label: 'Prefer not to say', exclusive: true },
];

const definition = (image?: string): FormDefinition => ({
  formatVersion: '1.5',
  id: 'health',
  title: '',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'conditions',
      type: 'multiselect',
      label: 'Do you have any of these conditions?',
      options: options.map((option) => ({ ...option, ...(image && { image }) })),
    },
  ],
});

export function exclusiveScenarios(harness: RendererHarness, { it, expect, waitFor, fn, screen }: TestKit): void {
  const box = (name: string) => screen.getByRole('checkbox', { name }) as HTMLInputElement;
  const dividers = () => [...document.querySelectorAll('.fh-field__option-divider')];

  it('shows one divider before the exclusive options and keeps them native checkboxes', () => {
    harness.mount({ definition: definition(), onSubmit: fn() });
    expect(dividers().map((divider) => divider.textContent)).toEqual(['or']);
    expect(dividers()[0].nextElementSibling?.querySelector('input')).toBe(box('None of these'));
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  });

  it('takes the divider text from the or label', () => {
    harness.mount({ definition: definition('https://example.com/a.png'), labels: { or: 'или' }, onSubmit: fn() });
    expect(dividers().map((divider) => divider.textContent)).toEqual(['или']);
  });

  it('clears the other answers when an exclusive option is picked, and the reverse', async () => {
    const onSubmit = fn();
    harness.mount({ definition: definition(), onSubmit });
    await harness.click(box('Asthma'));
    await harness.click(box('Diabetes'));
    await harness.click(box('None of these'));
    await waitFor(() =>
      expect([box('Asthma').checked, box('Diabetes').checked, box('None of these').checked]).toEqual([false, false, true]),
    );
    await harness.click(box('Prefer not to say'));
    await waitFor(() => expect([box('None of these').checked, box('Prefer not to say').checked]).toEqual([false, true]));
    await harness.click(box('Asthma'));
    await waitFor(() => expect([box('Asthma').checked, box('Prefer not to say').checked]).toEqual([true, false]));
    await harness.submit(document.querySelector('form')!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ conditions: ['asthma'] }, expect.anything()));
  });
}
