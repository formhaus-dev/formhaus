import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { act, cleanup, screen, waitFor, within } from '@testing-library/react';
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

  it('hides the flow heading on the last step', async () => {
    await page.viewport(1440, 1000);
    renderEditor(fromDefinition(definition));
    await userEvent.click(within(screen.getByRole('group', { name: 'Notes, step 3 of 3' })).getByRole('button', { name: 'Step settings' }));
    expect(screen.getByRole('group', { name: 'Step settings' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Flow' })).toBeNull();
  });

  it('asks for a field in an earlier step when earlier steps have none', async () => {
    await page.viewport(1440, 1000);
    renderEditor(
      fromDefinition({
        ...definition,
        steps: [
          { id: 'intro', title: 'Intro', fields: [] },
          { id: 'team', title: 'Team', fields: [{ key: 'team', type: 'text', label: 'Team' }] },
        ],
      }),
    );
    await userEvent.click(within(screen.getByRole('group', { name: 'Intro, step 1 of 2' })).getByRole('button', { name: 'Step settings' }));
    expect(within(screen.getByRole('region', { name: 'Logic' })).getByText('Add a step before this one to use logic.')).toBeVisible();
    await userEvent.click(within(screen.getByRole('group', { name: 'Team, step 2 of 2' })).getByRole('button', { name: 'Step settings' }));
    expect(within(screen.getByRole('region', { name: 'Logic' })).getByText('Add a field to an earlier step to use logic.')).toBeVisible();
  });

  it('leaves out the logic hint when the form is read-only', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(fromDefinition(definition), { readOnly: true });
    const first = store.getState().form.blocks[0]!.uid;
    act(() => {
      store.select({ kind: 'step', uid: first });
      store.expand(first);
    });
    expect(screen.getByRole('group', { name: 'Step settings' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Logic' })).toBeNull();
  });
});
