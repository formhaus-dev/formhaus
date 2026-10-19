import { EditorView } from '@codemirror/view';
import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition, FormField } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import ReactPreview from '../preview/ReactPreview';
import { renderEditor } from './harness';

type Store = ReturnType<typeof renderEditor>['store'];

const definition = (fields: FormField[]): FormDefinition => ({ id: 'survey', title: 'Survey', submit: { label: 'Send' }, fields });
const first = (store: Store) => (toDefinition(store.getState().form).fields ?? [])[0] as FormField;

async function settings(label: string) {
  const card = screen.getByRole('group', { name: `${label} field` });
  await userEvent.click(within(card).getByRole('button', { name: 'Field settings' }));
  return within(within(card).getByRole('group', { name: 'Field settings' }));
}

const undo = () => screen.getAllByRole('button', { name: 'Undo' }).find((button) => button.hasAttribute('aria-keyshortcuts'))!;

describe('field settings in the inspector', () => {
  beforeEach(async () => {
    await page.viewport(1440, 1000);
  });

  afterEach(() => {
    cleanup();
  });

  it('sets help text on the card and the placeholder in settings', async () => {
    const { store } = renderEditor(fromDefinition(definition([{ key: 'age', type: 'number', label: 'Age' }])));
    const panel = await settings('Age');
    await userEvent.fill(
      within(screen.getByRole('group', { name: 'Age field' })).getAllByRole('textbox', { name: 'Help text' })[0]!,
      'In whole years',
    );
    await userEvent.fill(panel.getByRole('textbox', { name: 'Placeholder' }), '30');
    await waitFor(() => {
      expect(first(store)).toMatchObject({ helperText: 'In whole years', placeholder: '30' });
    });
    await userEvent.clear(panel.getByRole('textbox', { name: 'Placeholder' }));
    await waitFor(() => {
      expect(first(store)).not.toHaveProperty('placeholder');
    });
  });

  it('shows no placeholder or limits for a date', async () => {
    renderEditor(fromDefinition(definition([{ key: 'day', type: 'date', label: 'Day' }])));
    const panel = await settings('Day');
    expect(panel.queryByRole('textbox', { name: 'Help text' })).toBeNull();
    expect(panel.queryByRole('textbox', { name: 'Placeholder' })).toBeNull();
    expect(panel.queryByRole('region', { name: 'Limits' })).toBeNull();
  });

  it('sets, rejects and clears number limits with undo', async () => {
    const { store } = renderEditor(fromDefinition(definition([{ key: 'age', type: 'number', label: 'Age' }])));
    const panel = await settings('Age');
    const min = panel.getByRole('textbox', { name: 'Minimum' });
    const max = panel.getByRole('textbox', { name: 'Maximum' });
    await userEvent.fill(min, '18');
    await userEvent.fill(max, '99.5');
    await userEvent.tab();
    await waitFor(() => {
      expect(first(store).validation).toEqual({ min: 18, max: 99.5 });
    });
    expect(max).toHaveValue('99.5');
    await userEvent.fill(min, '120');
    await userEvent.tab();
    expect(await panel.findByText("Can't be more than 99.5")).toBeVisible();
    expect(first(store).validation).toEqual({ min: 18, max: 99.5 });
    await userEvent.fill(max, '');
    await waitFor(() => {
      expect(first(store).validation).toEqual({ min: 120 });
    });
    expect(panel.queryByText("Can't be more than 99.5")).toBeNull();
    await userEvent.fill(panel.getByRole('textbox', { name: 'Error if too low' }), 'Adults only');
    await waitFor(() => {
      expect(first(store).validation).toEqual({ min: 120, minMessage: 'Adults only' });
    });
    await userEvent.click(undo());
    await waitFor(() => {
      expect(first(store).validation).toEqual({ min: 120 });
    });
    expect(panel.queryByRole('textbox', { name: 'Error if too low' })).toHaveValue('');
  });

  it('drops a held limit when undo changes the stored range', async () => {
    const { store } = renderEditor(fromDefinition(definition([{ key: 'age', type: 'number', label: 'Age', validation: { min: 18 } }])));
    const panel = await settings('Age');
    const min = panel.getByRole('textbox', { name: 'Minimum' });
    await userEvent.fill(panel.getByRole('textbox', { name: 'Maximum' }), '99.5');
    await userEvent.fill(min, '120');
    await userEvent.tab();
    expect(await panel.findByText("Can't be more than 99.5")).toBeVisible();
    await userEvent.click(min);
    store.undo();
    await waitFor(() => {
      expect(min).toHaveValue('18');
    });
    expect(panel.queryByText("Can't be more than 99.5")).toBeNull();
    expect(first(store).validation).toEqual({ min: 18 });
  });

  it('removes the custom message with its limit and flags ambiguous numbers', async () => {
    const field: FormField = { key: 'age', type: 'number', label: 'Age', validation: { min: 18, minMessage: 'Adults only' } };
    const { store } = renderEditor(fromDefinition(definition([field])));
    const panel = await settings('Age');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Maximum' }), '1.000');
    await userEvent.tab();
    expect(await panel.findByText('Type 1000 or 1.0000')).toBeVisible();
    await userEvent.clear(panel.getByRole('textbox', { name: 'Minimum' }));
    await waitFor(() => {
      expect(first(store)).not.toHaveProperty('validation');
    });
    expect(panel.queryByRole('textbox', { name: 'Error if too low' })).toBeNull();
  });

  it('limits characters and checks the pattern of a text field', async () => {
    const { store } = renderEditor(fromDefinition(definition([{ key: 'code', type: 'text', label: 'Code' }])));
    const panel = await settings('Code');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Min characters' }), '2.5');
    await userEvent.tab();
    expect(await panel.findByText('Enter a whole number')).toBeVisible();
    await userEvent.fill(panel.getByRole('textbox', { name: 'Min characters' }), '2');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Max characters' }), '6');
    await userEvent.click(panel.getByRole('button', { name: 'Add a pattern' }));
    const pattern = panel.getByRole('textbox', { name: 'Pattern' });
    expect(pattern).toHaveFocus();
    await userEvent.fill(pattern, '([A-Z]');
    expect(panel.getByText('Not a valid pattern')).toBeVisible();
    await userEvent.fill(pattern, '^[A-Z]+$');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Error if no match' }), 'Capitals only');
    await waitFor(() => {
      expect(first(store).validation).toEqual({ minLength: 2, maxLength: 6, pattern: '^[A-Z]+$', patternMessage: 'Capitals only' });
    });
  });

  it('limits the selections of a multiselect', async () => {
    const options = ['a', 'b', 'c'].map((value) => ({ value, label: value.toUpperCase() }));
    const { store } = renderEditor(fromDefinition(definition([{ key: 'tags', type: 'multiselect', label: 'Tags', options }])));
    const panel = await settings('Tags');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Min selections' }), '1');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Max selections' }), '2');
    await waitFor(() => {
      expect(first(store).validation).toEqual({ minLength: 1, maxLength: 2 });
    });
    expect(panel.getByRole('textbox', { name: 'Error if too many' })).toHaveAttribute('placeholder', 'At most 2 allowed');
  });

  it('shows JSON limits, keeps unknown rules and survives a label change', async () => {
    const field: FormField = {
      key: 'age',
      type: 'number',
      label: 'Age',
      validation: { required: true, min: 1, maxMessage: 'Too many', validator: 'even' },
    };
    const { store } = renderEditor(fromDefinition(definition([field])));
    const panel = await settings('Age');
    expect(panel.getByRole('textbox', { name: 'Minimum' })).toHaveValue('1');
    expect(panel.getByRole('textbox', { name: 'Error if too high' })).toHaveValue('Too many');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Maximum' }), '10');
    await userEvent.fill(screen.getByRole('textbox', { name: 'Field label' }), 'Your age');
    await userEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    await waitFor(
      () => {
        const dom = document.querySelector<HTMLElement>('.cm-editor');
        const json = dom ? EditorView.findFromDOM(dom)?.state.doc.toString() : '';
        expect(JSON.parse(json ?? '{}').fields[0]).toEqual({
          key: 'yourAge',
          type: 'number',
          label: 'Your age',
          validation: { required: true, min: 1, maxMessage: 'Too many', validator: 'even', max: 10 },
        });
      },
      { timeout: 3000 },
    );
    expect(first(store).validation).toMatchObject({ min: 1, max: 10 });
  });

  it('rejects out-of-range answers in the preview', async () => {
    renderEditor(fromDefinition(definition([{ key: 'age', type: 'number', label: 'Age' }])), { host: { Preview: ReactPreview } });
    const panel = await settings('Age');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Minimum' }), '18');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Maximum' }), '65');
    await userEvent.fill(panel.getByRole('textbox', { name: 'Error if too low' }), 'Adults only');
    await userEvent.click(screen.getByRole('radio', { name: 'Preview' }));
    const preview = within(await screen.findByRole('region', { name: 'Preview' }));
    const age = await preview.findByRole('spinbutton', { name: /Age/ });
    await userEvent.fill(age, '12');
    await userEvent.click(preview.getByRole('button', { name: 'Send' }));
    expect(await preview.findByText('Adults only')).toBeVisible();
    await userEvent.fill(age, '70');
    await userEvent.click(preview.getByRole('button', { name: 'Send' }));
    expect(await preview.findByText('Must be at most 65')).toBeVisible();
    await userEvent.fill(age, '30');
    await userEvent.click(preview.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Preview only, nothing was sent')).toBeVisible();
  });
});
