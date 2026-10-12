import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

const definition: FormDefinition = {
  id: 'trip',
  title: 'Trip',
  submit: { label: 'Send' },
  steps: [
    { id: 'who', title: 'Who', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'where', title: 'Where', fields: [{ key: 'city', type: 'text', label: 'City' }] },
    { id: 'when', title: 'When', fields: [{ key: 'date', type: 'text', label: 'Date' }] },
  ],
};

const names = (group: HTMLElement) =>
  within(group)
    .getAllByRole<HTMLInputElement>('textbox')
    .map((box) => box.labels?.[0]?.textContent ?? '');

describe('buttons section', () => {
  afterEach(() => {
    cleanup();
  });

  it('puts the submit label under the fields of a single-step form', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor();
    const buttons = screen.getByRole('group', { name: 'Buttons for the form' });
    expect(names(buttons)).toEqual(['Submit button']);
    await userEvent.fill(within(buttons).getByRole('textbox', { name: 'Submit button' }), 'Join');
    await waitFor(() => {
      expect(toDefinition(store.getState().form).submit).toEqual({ label: 'Join' });
    });
  });

  it('shows the buttons each step has at the end of that step', async () => {
    await page.viewport(390, 844);
    const { store } = renderEditor(fromDefinition(definition));
    expect(names(screen.getByRole('group', { name: 'Buttons for Who' }))).toEqual(['Continue button']);
    expect(names(screen.getByRole('group', { name: 'Buttons for Where' }))).toEqual(['Continue button', 'Back button']);
    const last = screen.getByRole('group', { name: 'Buttons for When' });
    expect(names(last)).toEqual(['Submit button', 'Back button']);
    await userEvent.fill(within(last).getByRole('textbox', { name: 'Back button' }), 'Previous');
    await waitFor(() => {
      expect(toDefinition(store.getState().form).steps?.[2]?.back).toEqual({ label: 'Previous' });
    });
  });
});
