import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition, FormField, FormSection } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

const fieldAt = (store: { getState: () => { form: Parameters<typeof toDefinition>[0] } }, index: number) =>
  (toDefinition(store.getState().form).fields ?? [])[index] as FormField;
const definition = (fields: FormField[]): FormDefinition => ({ id: 'survey', title: 'Survey', submit: { label: 'Send' }, fields });
const name: FormField = { key: 'name', type: 'text', label: 'Name' };

async function pick(option: RegExp) {
  await userEvent.click(screen.getAllByRole('button', { name: 'Add field' }).at(-1)!);
  await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: option }));
}

describe('question types in the editor', () => {
  afterEach(() => {
    cleanup();
  });

  it('adds an NPS scale with anchors and auto-advance', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition([name])));
    await pick(/^NPS/);
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.[1]).toEqual({
        key: 'nps',
        type: 'scale',
        label: 'How likely are you to recommend us to a friend or colleague?',
        autoAdvance: true,
        validation: { min: 0, max: 10 },
        options: [
          { value: '0', label: 'Not at all likely' },
          { value: '10', label: 'Extremely likely' },
        ],
      });
    });
  });

  it('edits the range and anchors of a rating', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition([{ key: 'stars', type: 'rating', label: 'Stars' }])));
    const card = screen.getByRole('group', { name: 'Stars field' });
    await userEvent.click(within(card).getByRole('button', { name: 'Field settings' }));
    await userEvent.fill(within(card).getByRole('spinbutton', { name: 'Stars' }), '7');
    await userEvent.fill(within(card).getByRole('textbox', { name: 'End label' }), 'Loved it');
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.[0]).toMatchObject({
        validation: { max: 7 },
        options: [{ value: '7', label: 'Loved it' }],
      });
    });
    expect(within(card).getByRole('list', { name: '7 stars' })).toBeVisible();
  });

  it('keeps the anchors when "10" is typed into a 1 to 5 scale', async () => {
    await page.viewport(1440, 1000);
    const anchors = [
      { value: '1', label: 'Low' },
      { value: '5', label: 'High' },
    ];
    const { store } = renderEditor(fromDefinition(definition([{ key: 'score', type: 'scale', label: 'Score', options: anchors }])));
    const card = screen.getByRole('group', { name: 'Score field' });
    await userEvent.click(within(card).getByRole('button', { name: 'Field settings' }));
    const end = within(card).getByRole('spinbutton', { name: 'Ends at' });
    await userEvent.click(end);
    await userEvent.keyboard('10');
    expect(fieldAt(store, 0).options).toEqual(anchors);
    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(fieldAt(store, 0)).toMatchObject({
        validation: { max: 10 },
        options: [
          { value: '1', label: 'Low' },
          { value: '10', label: 'High' },
        ],
      });
    });
  });

  it('adds a matrix and keeps the columns of every row in sync', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition([name])));
    await pick(/^Matrix/);
    const rows = () => ((toDefinition(store.getState().form).fields ?? [])[1] as unknown as FormSection).fields as FormField[];
    await waitFor(() => {
      expect(rows()).toHaveLength(2);
    });
    expect(rows()[1]!.options).toEqual(rows()[0]!.options);
    await userEvent.click(screen.getAllByRole('textbox', { name: 'Field label' })[2]!);
    await userEvent.fill(screen.getAllByRole('textbox', { name: 'Option 1' })[0]!, 'Never');
    await waitFor(() => {
      expect(rows()[1]!.options?.[0]).toEqual({ value: 'never', label: 'Never' });
    });
    const section = screen.getAllByRole('group').find((item) => item.getAttribute('aria-label')?.endsWith('section'))!;
    await userEvent.click(within(section).getByRole('button', { name: 'Field settings' }));
    expect(within(section).getByRole('switch', { name: 'Show as matrix' })).toBeChecked();
  });

  it('adds a statement and a welcome screen without fields', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition([name])));
    await pick(/^Statement/);
    await pick(/^Welcome screen/);
    await waitFor(() => {
      const [welcome, rest] = toDefinition(store.getState().form).steps ?? [];
      expect(welcome).toMatchObject({ title: 'Welcome', next: { label: 'Start' }, fields: [] });
      expect(rest!.fields[1]).toMatchObject({ type: 'section', fields: [] });
    });
  });

  it('sets option images on a picture choice', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition([name])));
    await pick(/^Picture choice/);
    const url = await screen.findByRole('textbox', { name: 'Image URL for Option 1' });
    await userEvent.fill(url, 'https://example.com/a.png');
    await waitFor(() => {
      expect(fieldAt(store, 1).options?.[0]).toMatchObject({ image: 'https://example.com/a.png' });
    });
  });

  it('branches on a scale with is at least', async () => {
    await page.viewport(1440, 1000);
    const nps: FormField = { key: 'nps', type: 'scale', label: 'NPS', validation: { min: 0, max: 10 } };
    const { store } = renderEditor(fromDefinition(definition([nps, { key: 'love', type: 'textarea', label: 'Love' }])));
    const card = screen.getByRole('group', { name: 'Love field' });
    await userEvent.click(within(card).getByRole('button', { name: 'Field settings' }));
    const logic = screen.getByRole('region', { name: 'Logic' });
    await userEvent.selectOptions(within(logic).getByRole('combobox', { name: 'Show this field' }), 'all');
    await userEvent.selectOptions(within(logic).getByRole('combobox', { name: 'Operator' }), 'gte');
    await userEvent.selectOptions(within(logic).getByRole('combobox', { name: 'Value' }), '9');
    await waitFor(() => {
      expect(fieldAt(store, 1).show).toEqual([{ field: 'nps', gte: 9 }]);
    });
    expect(within(card).getByRole('button', { name: 'Shown if NPS is at least 9' })).toBeVisible();
  });
});
