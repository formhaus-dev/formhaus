import { fromDefinition, toDefinition } from '@formhaus/builder';
import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { renderEditor } from './harness';

const form = () =>
  fromDefinition({
    id: 'drag',
    title: 'Drag',
    submit: { label: 'Send' },
    fields: ['First', 'Second', 'Third'].map((label) => ({ key: label.toLowerCase(), type: 'text', label })),
  });

function clipped(element: HTMLElement): boolean {
  const box = element.getBoundingClientRect();
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    if (getComputedStyle(node).overflow === 'visible') continue;
    const frame = node.getBoundingClientRect();
    if (box.top < frame.top || box.bottom > frame.bottom || box.left < frame.left || box.right > frame.right) return true;
  }
  return false;
}

describe('dragging a field card', () => {
  afterEach(() => {
    cleanup();
  });

  it('lifts the card into an unclipped overlay with a dashed placeholder and moves it', async () => {
    await page.viewport(1440, 1000);
    const { store } = renderEditor(form());
    const handle = screen.getByRole('button', { name: 'Reorder Third' });
    handle.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    let overlay: HTMLElement | null = null;
    await waitFor(() => {
      overlay = document.body.querySelector<HTMLElement>(':scope > div [class*="overlay"]');
      expect(overlay).not.toBeNull();
    });
    const lifted = overlay as unknown as HTMLElement;
    const box = lifted.getBoundingClientRect();
    expect(box.width).toBeGreaterThan(200);
    expect(clipped(lifted)).toBe(false);
    const placeholder = document.querySelector<HTMLElement>('[data-dragging]');
    expect(placeholder && getComputedStyle(placeholder).outlineStyle).toBe('dashed');
    await userEvent.keyboard(' ');
    await waitFor(() => {
      expect(toDefinition(store.getState().form).fields?.map((field) => field.key)).toEqual(['third', 'first', 'second']);
    });
  });
});
