import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition, FormField, FormNode } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

type Store = ReturnType<typeof renderEditor>['store'];

const plan: FormField = {
  key: 'plan',
  type: 'radio',
  label: 'Plan',
  options: [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro' },
  ],
};
const company: FormField = { key: 'company', type: 'text', label: 'Company' };
const definition = (fields: FormNode[]): FormDefinition => ({ id: 'plans', title: 'Plans', submit: { label: 'Send' }, fields });
const sections = (label: string) =>
  [...within(screen.getByRole('group', { name: `${label} field` })).getByRole('group', { name: 'Field settings' }).children].map((node) =>
    node.getAttribute('aria-label'),
  );
const companyOf = (store: Store) => (toDefinition(store.getState().form).fields ?? [])[1] as FormField;

async function settings(label: string) {
  const card = screen.getByRole('group', { name: `${label} field` });
  await userEvent.click(within(card).getByRole('button', { name: 'Field settings' }));
  return within(within(card).getByRole('group', { name: 'Field settings' }));
}

describe('field settings sections', () => {
  beforeEach(async () => {
    await page.viewport(1440, 1000);
  });

  afterEach(() => {
    cleanup();
  });

  it('groups a choice field into options, logic and advanced without a required switch', async () => {
    renderEditor(fromDefinition(definition([plan, company])));
    const panel = await settings('Plan');
    expect(sections('Plan')).toEqual(['Options', 'Logic', 'Advanced']);
    expect(panel.queryByRole('switch', { name: 'Required' })).toBeNull();
    await settings('Company');
    expect(sections('Company')).toEqual(['Answer', 'Logic', 'Advanced']);
  });

  it('toggles required from the card head with the keyboard', async () => {
    const { store } = renderEditor(fromDefinition(definition([plan, company])));
    await settings('Company');
    const answer = within(screen.getByRole('radiogroup', { name: 'Answer for Company' }));
    answer.getByRole('radio', { name: 'Optional' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(companyOf(store).validation).toEqual({ required: true });
    });
    expect(answer.getByRole('radio', { name: 'Required' })).toBeChecked();
  });

  it('toggles required from the field menu', async () => {
    const { store } = renderEditor(fromDefinition(definition([plan, company])));
    const card = within(screen.getByRole('group', { name: 'Company field' }));
    await userEvent.click(card.getByRole('button', { name: 'Field actions' }));
    const item = await screen.findByRole('menuitemcheckbox', { name: 'Required' });
    expect(item).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(item);
    await waitFor(() => {
      expect(companyOf(store).validation).toEqual({ required: true });
    });
    await userEvent.click(card.getByRole('button', { name: 'Field actions' }));
    expect(await screen.findByRole('menuitemcheckbox', { name: 'Required' })).toHaveAttribute('aria-checked', 'true');
  });

  it('starts logic from the button and shows match only with two conditions', async () => {
    const { store } = renderEditor(fromDefinition(definition([plan, company])));
    const panel = await settings('Company');
    const logic = within(panel.getByRole('region', { name: 'Logic' }));
    expect(logic.getByRole('button', { name: 'Add condition' })).toBeVisible();
    await userEvent.click(logic.getByRole('button', { name: 'Add condition' }));
    await waitFor(() => {
      expect(companyOf(store).show).toEqual([{ field: 'plan', eq: 'free' }]);
    });
    const top = (name: string) => Math.round(logic.getByRole('combobox', { name }).getBoundingClientRect().top);
    expect(new Set([top('Question'), top('Operator'), top('Value')]).size).toBe(1);
    expect(logic.queryByRole('radiogroup', { name: 'Match' })).toBeNull();
    await userEvent.click(logic.getByRole('button', { name: 'Add condition' }));
    await userEvent.click(logic.getByRole('radio', { name: 'any' }));
    await waitFor(() => {
      expect(companyOf(store).showAny).toHaveLength(2);
    });
    await userEvent.click(logic.getByRole('button', { name: 'Remove condition 2' }));
    await userEvent.click(logic.getByRole('button', { name: 'Remove condition 1' }));
    await waitFor(() => {
      expect(companyOf(store)).not.toHaveProperty('showAny');
    });
    expect(companyOf(store)).not.toHaveProperty('show');
    await userEvent.click(logic.getByRole('button', { name: 'Add condition' }));
    await waitFor(() => {
      expect(companyOf(store).show).toEqual([{ field: 'plan', eq: 'free' }]);
    });
    expect(companyOf(store)).not.toHaveProperty('showAny');
  });

  it('points to the JSON tab for conditions the editor cannot show in a read-only form', async () => {
    const mixed: FormField = { ...company, show: [{ field: 'plan', eq: 'pro' }], showAny: [{ field: 'plan', eq: 'free' }] };
    renderEditor(fromDefinition(definition([plan, mixed])), { readOnly: true });
    await userEvent.click(screen.getByRole('button', { name: 'Shown on custom conditions' }));
    const logic = within(screen.getByRole('region', { name: 'Logic' }));
    expect(logic.getByText('This field uses conditions the editor cannot show. Edit them in the JSON tab.')).toBeVisible();
    expect(logic.queryByRole('button', { name: 'Add condition' })).toBeNull();
  });

  it('asks for a field above instead of offering logic on the first field', async () => {
    renderEditor(fromDefinition(definition([plan, company])));
    const panel = await settings('Plan');
    const logic = within(panel.getByRole('region', { name: 'Logic' }));
    expect(logic.getByText('Add a field above to use logic.')).toBeVisible();
    expect(logic.queryByRole('button', { name: 'Add condition' })).toBeNull();
  });

  it('keeps the response key under a collapsed advanced section', async () => {
    renderEditor(fromDefinition(definition([plan, company])));
    const panel = await settings('Company');
    const toggle = panel.getByRole('button', { name: 'Advanced' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel.queryByText('Response key')).toBeNull();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel.getByText('Response key')).toBeVisible();
  });

  it('opens advanced for a field without a key and keeps it open while the label is typed', async () => {
    renderEditor(fromDefinition(definition([plan, { key: '', type: 'text', label: '' }])));
    const panel = await settings('Untitled question');
    const toggle = panel.getByRole('button', { name: 'Advanced' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const card = within(screen.getByRole('group', { name: 'Untitled question field' }));
    await userEvent.type(card.getByRole('textbox', { name: 'Field label' }), 'Team');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('leaves the required control off a repeatable group', async () => {
    renderEditor(
      fromDefinition(
        definition([plan, { key: 'people', type: 'group', label: 'People', fields: [{ key: 'name', type: 'text', label: 'Name' }] }]),
      ),
    );
    const card = screen.getByRole('group', { name: 'People repeatable group' });
    await userEvent.click(within(card).getByRole('button', { name: 'Field settings' }));
    expect(screen.queryByRole('radiogroup', { name: 'Answer for People' })).toBeNull();
    await userEvent.click(within(card).getAllByRole('button', { name: 'Field actions' })[0]!);
    expect(await screen.findByRole('menuitem', { name: /^Duplicate/ })).toBeVisible();
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Required' })).toBeNull();
  });
});
