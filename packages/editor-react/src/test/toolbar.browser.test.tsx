import { fromDefinition } from '@formhaus/builder';
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

  it.each(width >= 1280 ? ['Visual', 'JSON'] : ['Visual', 'JSON', 'Preview'])(
    'covers nothing in %s at rest and lines up with the content',
    async (mode) => {
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
      const content = box(document.querySelector('[data-topbar]')?.nextElementSibling ?? null);
      expect(bar.left).toBe(shell.left);
      expect(bar.right).toBe(shell.right);
      expect(group.left).toBe(content.left);
      expect(group.top - bar.top).toBeGreaterThan(0);
    },
  );
});

describe.each([0, 64])('the stuck toolbar under a %ipx host header', (header) => {
  afterEach(() => {
    cleanup();
    document.documentElement.style.removeProperty('--fh-ed-layout-topbar');
    document.querySelector('[data-fake-header]')?.remove();
  });

  it('sticks below the header with a border and without moving the content', async () => {
    await page.viewport(1024, 700);
    document.documentElement.style.setProperty('--fh-ed-layout-topbar', `${String(header)}px`);
    const fake = Object.assign(document.createElement('div'), {
      style: `position:fixed;top:0;left:0;right:0;height:${String(header)}px;z-index:1000`,
    });
    fake.dataset.fakeHeader = '';
    document.body.prepend(fake);
    const fields = Array.from({ length: 30 }, (_, index) => ({
      key: `f${String(index)}`,
      type: 'text' as const,
      label: `Field ${String(index)}`,
    }));
    renderEditor(fromDefinition({ id: 'long', title: 'Long', submit: { label: 'Send' }, fields }));
    const bar = () => document.querySelector<HTMLElement>('[data-topbar]');
    const content = () => box(bar()?.nextElementSibling ?? null).top + window.scrollY;
    window.scrollTo(0, 0);
    const before = content();
    expect(bar()?.hasAttribute('data-stuck')).toBe(false);
    window.scrollTo(0, 400);
    await waitFor(() => {
      expect(bar()?.hasAttribute('data-stuck')).toBe(true);
    });
    expect(content()).toBe(before);
    expect(Math.round(box(bar()).top)).toBe(header);
    expect(getComputedStyle(bar() as HTMLElement).borderBottomColor).not.toBe('rgba(0, 0, 0, 0)');
  });
});
