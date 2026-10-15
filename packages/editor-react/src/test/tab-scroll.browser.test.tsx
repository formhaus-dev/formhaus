import { fromDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

const long = {
  id: 'long',
  title: 'Long',
  submit: { label: 'Send' },
  fields: Array.from({ length: 40 }, (_, index) => ({ key: `f${String(index)}`, type: 'text', label: `Field ${String(index)}` })),
} as FormDefinition;

const mode = async (name: string) => {
  const label = screen.getByRole('radio', { name }).closest('label');
  if (!label) throw new Error(`no ${name} tab`);
  await userEvent.click(label);
};

describe('scroll position per tab', () => {
  afterEach(() => {
    cleanup();
    document.querySelector('[data-spacer]')?.remove();
  });

  it('opens a new tab at the top of the editor and restores a visited one', async () => {
    await page.viewport(1440, 700);
    const spacer = Object.assign(document.createElement('div'), { style: 'height: 300px' });
    spacer.dataset.spacer = '';
    document.body.prepend(spacer);
    renderEditor(fromDefinition(long), { host: { Preview: () => <div style={{ height: 3000 }} /> } });
    const editorTop = () =>
      Math.round((document.querySelector('[data-topbar]')?.parentElement?.getBoundingClientRect().top ?? 0) + window.scrollY);
    await mode('JSON');
    await waitFor(() => {
      expect(document.querySelector('.cm-content')).toBeTruthy();
    });
    expect(window.scrollY).toBe(0);
    window.scrollTo(0, 2000);
    await waitFor(() => {
      expect(window.scrollY).toBe(2000);
    });
    await mode('Preview');
    await waitFor(() => {
      expect(Math.round(window.scrollY)).toBe(editorTop());
    });
    expect(editorTop()).toBe(300);
    await mode('JSON');
    await waitFor(() => {
      expect(window.scrollY).toBe(2000);
    });
    window.scrollTo(0, 1500);
    await mode('Visual');
    await waitFor(() => {
      expect(window.scrollY).toBe(0);
    });
    await mode('JSON');
    await waitFor(() => {
      expect(window.scrollY).toBe(1500);
    });
  });
});
