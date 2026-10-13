import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

const definition: FormDefinition = {
  id: 'plans',
  title: 'Plans',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'plan',
      title: 'Plan',
      fields: [
        {
          key: 'plan',
          type: 'radio',
          label: 'Plan',
          options: [
            { value: 'free', label: 'Free' },
            { value: 'pro', label: 'Pro' },
          ],
        },
      ],
    },
    { id: 'team', title: 'Team', fields: [{ key: 'team', type: 'text', label: 'Team' }] },
    { id: 'notes', title: 'Notes', fields: [{ key: 'notes', type: 'textarea', label: 'Notes' }] },
  ],
};

describe('branching in a browser', () => {
  afterEach(() => {
    cleanup();
  });

  it('sends each answer to a later step or ends the form', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition));
    await userEvent.click(screen.getByRole('group', { name: 'Plan field' }), { position: { x: 30, y: 20 } });
    await userEvent.click(screen.getByRole('button', { name: /^After Free, go to/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'End form' }));
    await userEvent.click(screen.getByRole('button', { name: /^After Pro, go to/ }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Notes' }));
    await waitFor(() => {
      expect(toDefinition(store.getState().form).steps?.[0]?.routes).toEqual([
        { to: null, show: [{ field: 'plan', eq: 'free' }] },
        { to: 'notes' },
      ]);
    });
  });

  it('picks the step after this one and allows skipping', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition));
    await userEvent.click(within(screen.getByRole('group', { name: 'Team, step 2 of 3' })).getByRole('button', { name: 'Step settings' }));
    const flow = screen.getByRole('region', { name: 'Flow' });
    await userEvent.selectOptions(within(flow).getByRole('combobox', { name: 'After this step' }), 'End form');
    await userEvent.click(within(screen.getByRole('group', { name: 'Buttons for Team' })).getByRole('switch', { name: 'Allow skipping' }));
    await waitFor(() => {
      expect(toDefinition(store.getState().form).steps?.[1]).toMatchObject({ routes: [{ to: null }], skip: { label: 'Skip' } });
    });
  });
});
