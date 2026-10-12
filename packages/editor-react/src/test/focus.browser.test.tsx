import { fromDefinition } from '@formhaus/builder';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { EditorScreen } from '../shell/EditorScreen';
import { TestRoot, fieldLabel, renderEditor, topBar } from './harness';
import { testHost } from './host';

const liveRegion = () => document.querySelector<HTMLElement>('[data-live-region]');

const form = () =>
  fromDefinition({
    id: 'focus',
    title: 'Focus',
    submit: { label: 'Send' },
    fields: ['First', 'Second'].map((label) => ({ key: label.toLowerCase(), type: 'text', label })),
  });

describe('editor focus and announcements', () => {
  afterEach(() => {
    cleanup();
  });

  it('moves focus to Redo when Undo disappears under the keyboard', async () => {
    await page.viewport(1440, 1000);
    renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('A');
    const undo = await screen.findByRole('button', { name: 'Undo' });
    undo.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(topBar().querySelector('[aria-label="Undo"]')).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Redo' }));
    });
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Undo' }));
    });
  });

  it('keeps focus on the handle while a card is lifted', async () => {
    await page.viewport(1440, 1000);
    renderEditor(form());
    const handle = screen.getByRole('button', { name: 'Reorder Second' });
    handle.focus();
    await userEvent.keyboard(' ');
    await waitFor(() => {
      expect(document.querySelector('[data-dragging]')).not.toBeNull();
    });
    expect(document.activeElement).toBe(handle);
    await userEvent.keyboard('{Escape}');
  });

  it('rings a card focused from code before any pointer input', async () => {
    await page.viewport(1440, 1000);
    renderEditor(form());
    delete document.documentElement.dataset.input;
    const card = document.querySelector<HTMLElement>('[data-card]');
    card?.focus();
    expect(card && getComputedStyle(card).outlineStyle).toBe('solid');
    document.documentElement.dataset.input = 'pointer';
    expect(card && getComputedStyle(card).outlineStyle).toBe('none');
  });

  it('moves focus to the mode control when the last Undo disappears on a phone', async () => {
    await page.viewport(390, 844);
    renderEditor();
    await userEvent.click(fieldLabel(0));
    await userEvent.keyboard('A');
    const undo = await screen.findByRole('button', { name: 'Undo' });
    undo.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(topBar().querySelector('[aria-label="Undo"]')).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Visual' }));
    });
  });

  it('announces a failed save and the recovery, not every save', async () => {
    await page.viewport(390, 844);
    let fail = true;
    const save = testHost().save;
    const host = testHost({
      save: (definition, revision) => {
        if (!fail) return save(definition, revision);
        fail = false;
        return Promise.reject(new Error('offline'));
      },
    });
    render(
      <TestRoot>
        <EditorScreen host={host} />
      </TestRoot>,
    );
    await userEvent.click(await screen.findByRole('textbox', { name: 'Field label' }));
    await userEvent.keyboard('Email');
    await waitFor(
      () => {
        expect(liveRegion()).toHaveTextContent('Couldn’t save');
      },
      { timeout: 3000 },
    );
    await userEvent.keyboard('s');
    await waitFor(
      () => {
        expect(liveRegion()).toHaveTextContent('Saved');
      },
      { timeout: 3000 },
    );
  });

  it('announces a deleted field once, through the toast', async () => {
    await page.viewport(1440, 1000);
    renderEditor(form());
    await userEvent.click(fieldLabel(1));
    const card = document.querySelectorAll<HTMLElement>('[data-card]')[1];
    if (!card) throw new Error('No second card');
    await userEvent.click(within(card).getByRole('button', { name: 'Field actions' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Delete/ }));
    await screen.findByText('Deleted “Second”');
    expect(liveRegion()?.textContent).not.toContain('deleted');
  });

  it('closes inline settings with Escape and returns focus to the toggle', async () => {
    await page.viewport(1440, 1000);
    renderEditor(form());
    await userEvent.click(fieldLabel(0));
    const toggle = screen.getAllByRole('button', { name: 'Field settings' })[0];
    if (!toggle) throw new Error('No settings toggle');
    toggle.focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('group', { name: 'Field settings' });
    await waitFor(() => {
      expect(document.activeElement?.closest('[data-settings]')).not.toBeNull();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('group', { name: 'Field settings' })).toBeNull();
    });
    expect(document.activeElement).toBe(toggle);
  });
});
