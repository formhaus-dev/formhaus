import { fromDefinition } from '@formhaus/builder';
import type { FormDefinition, FormField } from '@formhaus/core';
import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { renderEditor } from './harness';

const pick = (...labels: string[]) => labels.map((label, index) => ({ value: String(index), label }));
const image = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';

const fields: FormField[] = [
  { key: 'name', type: 'text', label: 'Full name' },
  { key: 'email', type: 'email', label: 'Email' },
  { key: 'age', type: 'number', label: 'Age', validation: { min: 18, max: 99 } },
  { key: 'country', type: 'select', label: 'Country', options: pick('France', 'Spain') },
  { key: 'plan', type: 'radio', label: 'Plan', options: pick('Basic', 'Pro') },
  { key: 'tags', type: 'multiselect', label: 'Topics', options: pick('Design', 'Code', 'Sales'), validation: { maxLength: 2 } },
  {
    key: 'look',
    type: 'radio',
    label: 'Pick a picture',
    options: [
      { value: 'a', label: 'Sea', image },
      { value: 'b', label: 'Hills', image },
    ],
  },
  { key: 'day', type: 'date', label: 'Start date' },
  { key: 'cv', type: 'file', label: 'CV' },
  { key: 'score', type: 'scale', label: 'Score' },
  {
    key: 'nps',
    type: 'scale',
    label: 'How likely are you to recommend us to a friend or colleague?',
    autoAdvance: true,
    validation: { min: 0, max: 10 },
    options: pick('Not at all likely'),
  },
  { key: 'stars', type: 'rating', label: 'Stars' },
  { key: 'notes', type: 'textarea', label: 'Notes' },
  { key: 'ref', type: 'hidden', label: 'Source', source: 'referrer' } as FormField,
];

const form: FormDefinition = {
  id: 'layout',
  title: 'Layout',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'welcome',
      title: 'Welcome',
      fields: [
        ...fields,
        {
          key: 'grid',
          type: 'section',
          title: 'Rate us',
          layout: 'matrix',
          fields: [{ key: 'easy', type: 'radio', label: 'Easy', options: pick('Yes', 'No') }],
        },
      ],
    },
  ],
} as FormDefinition;

const round = (value: number) => Math.round(value);
const box = (node: Element) => node.getBoundingClientRect();
const visible = (node: Element) => box(node).width > 0 && box(node).height > 0;

function settle() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

function measure(card: HTMLElement) {
  const settings = card.querySelector<HTMLElement>('[data-settings]')!;
  const panel = settings.firstElementChild as HTMLElement;
  const left = round(box(panel).left);
  const style = getComputedStyle(panel);
  const columns = style.gridTemplateColumns.split(' ').map(parseFloat);
  const lines = new Set([left, round(left + (columns[0] ?? 0) + parseFloat(style.columnGap || '0'))]);
  const outside = (node: Element) => !node.closest('[class*="Logic_condition"]');
  const labels = [...panel.querySelectorAll('label[for], [class*="controlLabel"], [class*="settingLabel"]')]
    .filter(visible)
    .filter(outside);
  const controls = [
    ...panel.querySelectorAll(
      'input:not([type=hidden], [type=radio], [type=checkbox]), select, [role=radiogroup], label:has([role=switch])',
    ),
  ]
    .filter(visible)
    .filter(outside)
    .map((node) => (node.tagName === 'SELECT' ? node.parentElement! : node));
  const strays = [...labels, ...controls]
    .filter((node) => !lines.has(round(box(node).left)))
    .map(
      (node) =>
        `${node.tagName.toLowerCase()} "${node.textContent?.trim() || node.getAttribute('aria-label') || ''}" at ${String(round(box(node).left))}`,
    );
  const rows = new Map<number, number[]>();
  for (const node of controls.filter((item) => item.tagName !== 'LABEL')) {
    const top = round(box(node).top);
    rows.set(top, [...(rows.get(top) ?? []), round(box(node).height)]);
  }
  const uneven = [...rows.values()].filter((heights) => new Set(heights).size > 1);
  const title = card.querySelector('textarea[aria-label="Field label"], textarea[aria-label="Section title"]');
  const edges = [title, card.querySelector('[aria-label="Points"]'), card.querySelector('textarea[aria-label="Help text"]')]
    .filter((node): node is Element => !!node && visible(node))
    .map((node) => round(box(node).left))
    .filter((x) => x !== left);
  return { strays, uneven, edges };
}

function small(card: HTMLElement) {
  return [...card.querySelectorAll<HTMLElement>('button, input:not([type=hidden]), select, textarea')]
    .filter(visible)
    .map((node) => {
      const target =
        node.getAttribute('role') === 'switch'
          ? node.closest('label')!
          : node.tagName === 'TEXTAREA'
            ? node.parentElement!
            : node.getAttribute('type') === 'radio'
              ? node.parentElement!
              : (node.closest('label') ?? node);
      return { name: node.getAttribute('aria-label') ?? node.textContent?.trim() ?? node.tagName, rect: box(target) };
    })
    .filter(({ rect }) => rect.height < 43.5 || rect.width < 43.5)
    .map(({ name, rect }) => `${name} ${String(round(rect.width))}x${String(round(rect.height))}`);
}

describe('inspector layout', () => {
  afterEach(() => {
    cleanup();
  });

  it.each([1280, 900, 390])('keeps one left edge and even rows for every field type at %i', async (width) => {
    await page.viewport(width, 900);
    const { store } = renderEditor(fromDefinition(form));
    const problems: string[] = [];
    for (const block of store.getState().form.blocks) {
      store.select(block.kind === 'page' ? { kind: 'step', uid: block.uid } : { kind: 'field', uid: block.uid });
      store.expand(block.uid);
      await settle();
      const card = document.querySelector<HTMLElement>(`[data-card="${block.uid}"]`);
      if (!card?.querySelector('[data-settings]')) continue;
      const name = block.kind === 'page' ? block.id || block.uid : block.key;
      const { strays, uneven, edges } = measure(card);
      problems.push(...strays.map((item) => `${name}: ${item} is off the grid`));
      problems.push(...uneven.map((heights) => `${name}: one row has heights ${heights.join(', ')}`));
      problems.push(...edges.map((x) => `${name}: card content starts at ${String(x)}`));
      if (width === 390 && block.kind === 'question') problems.push(...small(card).map((item) => `${name}: ${item} is under 44px`));
    }
    expect(problems).toEqual([]);
  });
});
