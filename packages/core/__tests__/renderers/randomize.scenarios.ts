import { FormEngine, type FieldOption, type FormDefinition } from '@formhaus/core';
import type { RendererHarness, TestKit } from './fixtures';
import { research } from '@formhaus/core/research';

const choices = (...labels: string[]): FieldOption[] => labels.map((label) => ({ value: label.toLowerCase(), label }));

const definition: FormDefinition = {
  formatVersion: '1.6',
  id: 'survey',
  title: '',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'tools',
      type: 'multiselect',
      label: 'Which tools did you use last month?',
      randomize: true,
      options: [
        ...choices('Figma', 'Sketch', 'Framer', 'Penpot'),
        { value: 'other', label: 'Other', pinned: true },
        { value: 'none', label: 'None of these', exclusive: true },
      ],
    },
    {
      key: 'size',
      type: 'select',
      label: 'Size',
      placeholder: 'Pick a size',
      randomize: true,
      options: choices('Small', 'Medium', 'Large'),
    },
    { key: 'city', type: 'radio', label: 'City', randomize: true, optionsFrom: 'cities' },
    {
      key: 'team',
      type: 'group',
      label: 'Team',
      defaultItems: 2,
      fields: [
        { key: 'role', type: 'radio', label: 'Role', randomize: true, options: choices('Design', 'Engineering', 'Product', 'Research') },
      ],
    },
  ],
};

const cities = choices('Paris', 'Rome', 'Oslo', 'Lima');
const seed = 'visitor-1';
const shown = (key: string, options?: FieldOption[]) =>
  new FormEngine(definition, {}, { seed, research }).orderOptions(key, options).map(({ label }) => label);

export function randomizeScenarios(harness: RendererHarness, { it, expect, waitFor, fn, screen }: TestKit): void {
  const labelsOf = (role: string) =>
    screen.getAllByRole(role).map((element) => (element as HTMLInputElement).labels?.[0]?.textContent?.trim());

  it('renders options in the seeded order in the DOM and keeps it after an answer', async () => {
    harness.mount({ definition, seed, research, onSubmit: fn(), optionsProviders: { cities: () => cities } });
    const tools = shown('tools');
    expect(tools).not.toEqual(['Figma', 'Sketch', 'Framer', 'Penpot', 'Other', 'None of these']);
    expect(tools.slice(4)).toEqual(['Other', 'None of these']);
    expect(labelsOf('checkbox')).toEqual(tools);
    await harness.click(screen.getByRole('checkbox', { name: 'Penpot' }));
    expect(labelsOf('checkbox')).toEqual(tools);
    await waitFor(() => expect(labelsOf('radio').slice(0, 4)).toEqual(shown('city', cities)));
  });

  it('keeps the select placeholder first', () => {
    harness.mount({ definition, seed, research, onSubmit: fn() });
    const select = screen.getByRole('combobox', { name: 'Size' }) as HTMLSelectElement;
    expect([...select.options].map(({ textContent }) => textContent)).toEqual(['Pick a size', ...shown('size')]);
  });

  it('gives every group item the same order', () => {
    harness.mount({ definition, seed, research, onSubmit: fn() });
    const role = shown('team.role');
    expect(labelsOf('radio')).toEqual([...role, ...role]);
  });
}
