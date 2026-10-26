import { EditorView } from '@codemirror/view';
import { fromDefinition, toDefinition } from '@formhaus/builder';
import { type FormDefinition, FormEngine } from '@formhaus/core';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

const broken = {
  id: 'contact',
  title: 'Contact us',
  submit: { label: 'Send' },
  fields: [
    ...Array.from({ length: 30 }, (_, index) => ({ key: `f${String(index)}`, type: 'text', label: `Field ${String(index)}` })),
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'email', type: 'email', label: 'Work email' },
  ],
} as FormDefinition;

const Preview = ({ definition }: { definition: FormDefinition }) => {
  new FormEngine(definition);
  return <p>Rendered preview</p>;
};

const list = () => screen.getByRole('list', { name: 'Definition issues' });

const openPreview = async () => {
  const tab = screen.queryByRole('radio', { name: 'Preview' });
  if (tab) await userEvent.click(tab);
};

describe.each([
  [1440, 800],
  [390, 800],
])('issue navigation at %i px', (width, height) => {
  afterEach(() => {
    cleanup();
  });

  it('scrolls to the issue list and focuses it from the issue count', async () => {
    await page.viewport(width, height);
    renderEditor(fromDefinition(broken));
    await userEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    await waitFor(() => {
      expect(
        document.querySelector('.cm-editor') && EditorView.findFromDOM(document.querySelector('.cm-editor') as HTMLElement),
      ).toBeTruthy();
    });
    window.scrollTo(0, 0);
    await page.getByRole('button', { name: '1 issue', exact: true }).click();
    await waitFor(() => {
      const bar = document.querySelector('[data-topbar]')?.getBoundingClientRect();
      const top = list().getBoundingClientRect().top;
      expect(top).toBeGreaterThanOrEqual(bar?.bottom ?? 0);
      expect(top).toBeLessThan(window.innerHeight);
    });
    expect(document.activeElement).toBe(list());
  });

  it('offers the issues and the safe fixes from a preview that cannot render', async () => {
    await page.viewport(width, height);
    const { store } = renderEditor(fromDefinition(broken), { host: { Preview } });
    await openPreview();
    await userEvent.click(await screen.findByRole('button', { name: 'Fix all safe issues (1)' }, { timeout: 5000 }));
    expect(await screen.findByText('Rendered preview')).toBeTruthy();
    expect(toDefinition(store.getState().form).fields?.at(-1)?.key).toBe('email_2');
  });

  it('opens the issue list from the preview', async () => {
    await page.viewport(width, height);
    renderEditor(fromDefinition(broken), { host: { Preview } });
    await openPreview();
    await userEvent.click(await screen.findByRole('button', { name: 'Show issues (1)' }));
    await waitFor(() => {
      expect(document.activeElement).toBe(list());
    });
    expect(screen.getByRole('radio', { name: 'JSON' })).toBeChecked();
  });
});
