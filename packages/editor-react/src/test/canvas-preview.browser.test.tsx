import { fromDefinition } from '@formhaus/builder';
import type { FormDefinition, FormField } from '@formhaus/core';
import { cleanup, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { renderEditor } from './harness';

const form = (field: FormField): FormDefinition => ({ id: 'canvas', title: 'Canvas', submit: { label: 'Send' }, fields: [field] });

const nps: FormField = {
  key: 'nps',
  type: 'scale',
  label: 'How likely are you to recommend us to a friend or colleague?',
  validation: { min: 0, max: 10 },
  options: [
    { value: '0', label: 'Not at all likely' },
    { value: '10', label: 'Extremely likely' },
  ],
};

function textRange(node: Element) {
  const range = document.createRange();
  range.selectNodeContents(node);
  return range;
}

describe('canvas preview', () => {
  afterEach(() => {
    cleanup();
  });

  it.each([390, 1280])('puts the scale anchors on one line at the row edges at %i', async (width) => {
    await page.viewport(width, 900);
    renderEditor(fromDefinition(form(nps)));
    const points = screen.getByRole('list', { name: 'Points' });
    const anchors = [...(points.nextElementSibling?.children ?? [])].filter((node) => node.textContent);
    const [start, end] = [textRange(anchors[0]!), textRange(anchors.at(-1)!)];
    const box = points.getBoundingClientRect();
    expect(Math.round(start.getBoundingClientRect().left)).toBe(Math.round(box.left));
    expect(Math.round(end.getBoundingClientRect().right)).toBe(Math.round(box.right));
    expect([start.getClientRects().length, end.getClientRects().length]).toEqual([1, 1]);
  });

  it('shows a neutral placeholder for a picture that fails to load', async () => {
    await page.viewport(1280, 900);
    const options = ['a', 'b'].map((value) => ({ value, label: value.toUpperCase(), image: `https://example.invalid/${value}.png` }));
    renderEditor(fromDefinition(form({ key: 'look', type: 'radio', label: 'Look', options })));
    const card = screen.getByRole('group', { name: 'Look field' });
    await waitFor(() => {
      expect(card.querySelectorAll('[data-picture="empty"]')).toHaveLength(2);
    });
    expect(card.querySelectorAll('img')).toHaveLength(0);
    card.click();
    await waitFor(() => {
      expect(within(card).getAllByRole('textbox', { name: /Image URL/ })).toHaveLength(2);
      expect(card.querySelectorAll('[data-picture="empty"]')).toHaveLength(2);
    });
  });
});
