import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition, FormField } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

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

const definition = (fields: FormField[]): FormDefinition => ({ id: 'plans', title: 'Plans', submit: { label: 'Send' }, fields });

const card = (name: string) => screen.getByRole('group', { name: `${name} field` });

describe('field logic in a browser', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows a field only for some answers and labels the card', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition([plan, company])));
    await userEvent.click(within(card('Company')).getByRole('button', { name: 'Field settings' }));
    const logic = screen.getByRole('region', { name: 'Logic' });
    await userEvent.click(within(logic).getByRole('button', { name: 'Show only if…' }));
    await userEvent.selectOptions(within(logic).getByRole('combobox', { name: 'Value' }), 'pro');
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.[1]?.show).toEqual([{ field: 'plan', eq: 'pro' }]);
    });
    expect(within(card('Company')).getByRole('button', { name: 'Shown when Plan is Pro' })).toBeVisible();
  });

  it("offers includes and doesn't include for a multiselect source", async () => {
    await page.viewport(1440, 1000);
    const sources: FormField = {
      key: 'interests',
      type: 'multiselect',
      label: 'Interests',
      options: [
        { value: 'design', label: 'Design' },
        { value: 'other', label: 'Other' },
      ],
    };
    const { store } = renderEditor(fromDefinition(definition([sources, company])));
    await userEvent.click(within(card('Company')).getByRole('button', { name: 'Field settings' }));
    const logic = screen.getByRole('region', { name: 'Logic' });
    await userEvent.click(within(logic).getByRole('button', { name: 'Show only if…' }));
    const operator = within(logic).getByRole('combobox', { name: 'Operator' });
    expect([...operator.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'includes',
      "doesn't include",
      'is answered',
    ]);
    await userEvent.selectOptions(operator, 'notContains');
    await userEvent.selectOptions(within(logic).getByRole('combobox', { name: 'Value' }), 'other');
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.[1]?.show).toEqual([{ field: 'interests', notContains: 'other' }]);
    });
    expect(within(card('Company')).getByRole('button', { name: "Shown when Interests doesn't include Other" })).toBeVisible();
  });

  it('asks before deleting a field that conditions use and removes them', async () => {
    await page.viewport(1440, 1000);
    const form = fromDefinition(definition([plan, { ...company, show: [{ field: 'plan', eq: 'pro' }] }]));
    const { store } = renderEditor(form);
    await userEvent.click(within(card('Plan')).getByRole('button', { name: 'Field actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete field/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete “Plan”?' });
    expect(dialog.textContent).toContain('It is used in 1 condition.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete field' }));
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields).toEqual([{ key: 'company', type: 'text', label: 'Company' }]);
    });
  });
});
