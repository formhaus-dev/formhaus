import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormField } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

describe('file lists', () => {
  beforeEach(async () => {
    await page.viewport(1440, 1000);
  });

  afterEach(() => {
    cleanup();
  });

  it('allows several files and counts them', async () => {
    const { store } = renderEditor(
      fromDefinition({
        id: 'expenses',
        title: 'Expenses',
        submit: { label: 'Send' },
        fields: [{ key: 'receipts', type: 'file', label: 'Receipts' }],
      }),
    );
    const first = () => toDefinition(store.getState().form);
    const field = () => (first().fields ?? [])[0] as FormField;
    const card = screen.getByRole('group', { name: 'Receipts field' });
    await userEvent.click(within(card).getByRole('button', { name: 'Field settings' }));
    const panel = within(within(card).getByRole('group', { name: 'Field settings' }));
    expect(panel.queryByRole('textbox', { name: 'Max files' })).toBeNull();
    await userEvent.click(panel.getByRole('switch', { name: 'Allow several files' }));
    await waitFor(() => {
      expect(first().formatVersion).toBe('1.7');
    });
    expect(field().multiple).toBe(true);
    await userEvent.fill(panel.getByRole('textbox', { name: 'Max files' }), '3');
    await userEvent.tab();
    await waitFor(() => {
      expect(field().validation).toEqual({ maxLength: 3 });
    });
    await userEvent.click(panel.getByRole('switch', { name: 'Allow several files' }));
    await waitFor(() => {
      expect(field()).toEqual({ key: 'receipts', type: 'file', label: 'Receipts' });
    });
  });
});
