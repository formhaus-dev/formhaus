import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fieldLabel, renderEditor, topBar } from './harness';

const mod = () => (/Mac/.test(navigator.platform) ? 'Meta' : 'Control');

describe('editor toolbar and shortcuts in a browser', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows undo and redo only when there is something to undo or redo', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    const bar = topBar();
    expect(bar.querySelector('[aria-label="Undo"]')).toBeNull();
    expect(bar.querySelector('[aria-label="Redo"]')).toBeNull();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('Name');
    await waitFor(() => {
      expect(bar.querySelector('[aria-label="Undo"]')).not.toBeNull();
    });
    (bar.querySelector('[aria-label="Undo"]') as HTMLButtonElement).click();
    await waitFor(() => {
      expect(bar.querySelector('[aria-label="Redo"]')).not.toBeNull();
      expect(bar.querySelector('[aria-label="Undo"]')).toBeNull();
    });
  });

  it('opens the shortcut list with ? and switches to JSON with the backslash shortcut', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    await userEvent.keyboard('?');
    expect(await screen.findByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard(`{${mod()}>}\\{/${mod()}}`);
    await waitFor(() => {
      expect(screen.getByRole('radio', { name: 'JSON' })).toBeChecked();
    });
  });
});
