import { fromDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { ConfirmDialog } from '../ui';
import { renderEditor, TestRoot } from './harness';

const form: FormDefinition = {
  id: 'steps',
  title: 'Steps',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    { id: 'two', title: 'Two', fields: [{ key: 'age', type: 'number', label: 'Age' }] },
  ],
} as FormDefinition;

const footer = (dialog: HTMLElement) => [...dialog.querySelectorAll('footer button')].map((button) => button.getBoundingClientRect());
const names = (dialog: HTMLElement) => [...dialog.querySelectorAll('footer button')].map((button) => button.textContent?.trim());

function expectRow(dialog: HTMLElement) {
  const boxes = footer(dialog);
  expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
  const right = dialog.querySelector('footer > div')!.getBoundingClientRect().right;
  expect(Math.round(boxes.at(-1)!.right)).toBe(Math.round(right));
}

function expectStack(dialog: HTMLElement, first: string) {
  const boxes = footer(dialog).sort((a, b) => a.top - b.top);
  expect(new Set(boxes.map((box) => Math.round(box.left))).size).toBe(1);
  expect(new Set(boxes.map((box) => Math.round(box.width))).size).toBe(1);
  for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44);
  const ordered = [...dialog.querySelectorAll('footer button')].sort(
    (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
  );
  expect(ordered[0]?.textContent?.trim()).toBe(first);
  expect(ordered.at(-1)?.textContent?.trim()).toBe('Cancel');
}

async function deleteStep() {
  await userEvent.click(screen.getAllByRole('button', { name: 'Step actions' })[1]!);
  await userEvent.click(await screen.findByRole('menuitem', { name: /Delete step/ }));
  return screen.findByRole('dialog', { name: 'Delete “Two”?' });
}

describe('dialog footers', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps the delete step actions in one row on desktop', async () => {
    await page.viewport(1280, 900);
    renderEditor(fromDefinition(form));
    const dialog = await deleteStep();
    expect(names(dialog)).toEqual(['Cancel', 'Move field to step 1', 'Delete step and field']);
    expectRow(dialog);
  });

  it('stacks the delete step actions on a phone', async () => {
    await page.viewport(390, 844);
    renderEditor(fromDefinition(form));
    expectStack(await deleteStep(), 'Delete step and field');
  });

  it.each([
    [1280, 'row'],
    [390, 'stack'],
  ] as const)('lays out a confirm dialog at %i as a %s', async (width, layout) => {
    await page.viewport(width, 900);
    render(
      <TestRoot>
        <ConfirmDialog open title="Discard changes?" confirmLabel="Discard" onConfirm={() => undefined} />
      </TestRoot>,
    );
    const dialog = await screen.findByRole('dialog', { name: 'Discard changes?' });
    if (layout === 'row') expectRow(dialog);
    else expectStack(dialog, 'Discard');
  });
});
