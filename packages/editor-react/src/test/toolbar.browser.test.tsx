import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

const box = (element: Element | null) => {
  if (!element) throw new Error('missing element');
  return element.getBoundingClientRect();
};

function firstContent(): DOMRect | undefined {
  const bar = box(document.querySelector('[data-topbar]'));
  const visible = [...document.querySelectorAll('.fh-editor *')]
    .filter((element) => !element.closest('[data-topbar]') && element.children.length === 0)
    .map(box)
    .filter((rect) => rect.width > 0 && rect.height > 0 && rect.left < bar.right && rect.right > bar.left);
  return visible.sort((a, b) => a.top - b.top)[0];
}

describe.each([
  [1440, 900],
  [390, 844],
])('the toolbar at %i px', (width, height) => {
  afterEach(() => {
    cleanup();
  });

  it.each(['Visual', 'JSON', 'Preview'])('covers nothing in %s at rest and lines up with the content', async (mode) => {
    await page.viewport(width, height);
    renderEditor();
    await userEvent.click(screen.getByRole('radio', { name: mode }));
    window.scrollTo(0, 0);
    await waitFor(() => {
      const bar = box(document.querySelector('[data-topbar]'));
      expect(firstContent()?.top ?? bar.bottom).toBeGreaterThanOrEqual(bar.bottom);
    });
    const bar = box(document.querySelector('[data-topbar]'));
    const group = box(screen.getByRole('radiogroup', { name: 'Editor mode' }));
    const shell = box(document.querySelector('[data-topbar]')?.parentElement ?? null);
    expect(group.left).toBe(bar.left);
    expect(bar.left).toBeGreaterThan(shell.left);
    expect(shell.right - bar.right).toBe(bar.left - shell.left);
  });
});
