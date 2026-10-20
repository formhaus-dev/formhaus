import '@formhaus/core/style.css';
import type { FormField } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

const options = ['Disagree', 'Neutral', 'Agree'].map((label, index) => ({ value: String(index), label }));
const matrix = {
  key: 'staff',
  type: 'section',
  layout: 'matrix',
  title: 'About the staff',
  fields: [
    { key: 'friendly', type: 'radio', label: 'Friendly', options, validation: { required: true } },
    { key: 'quick', type: 'radio', label: 'Explained the options clearly and did not rush me through the checkout', options },
  ],
} as unknown as FormField;

function renderAt(width: number) {
  render(
    <div style={{ width, fontFamily: 'Georgia, serif' }}>
      <FormRenderer
        definition={{ formatVersion: '1.3', id: 'f', title: 'F', submit: { label: 'Send' }, fields: [matrix] }}
        onSubmit={() => {}}
        errorSummary={false}
      />
    </div>,
  );
}

const box = (node: Element) => node.getBoundingClientRect();
const center = (rect: DOMRect) => rect.left + rect.width / 2;

async function expectOneLeftEdge() {
  screen.getByRole('button', { name: 'Send' }).click();
  const error = await screen.findByRole('alert');
  const edges = [screen.getByText('About the staff'), screen.getByText('Friendly'), error].map((node) => Math.round(box(node).left));
  expect(new Set(edges).size).toBe(1);
}

describe('matrix layout', () => {
  afterEach(() => {
    cleanup();
  });

  it('puts each row label and its radios on one line under centered column labels', async () => {
    await page.viewport(1280, 900);
    renderAt(680);
    const header = [...document.querySelectorAll('.fh-section__matrix-header > *')].map(box);
    expect(header).toHaveLength(3);
    for (const name of ['Friendly', 'Explained the options clearly and did not rush me through the checkout']) {
      const row = screen.getByRole('group', { name });
      const label = box(row.querySelector('legend')!);
      const cells = [...row.querySelectorAll('.fh-field__radio-option')].map(box);
      const radios = [...row.querySelectorAll('input')].map(box);
      for (const cell of cells) {
        expect(Math.round(cell.top)).toBe(Math.round(label.top));
        expect(cell.height).toBeGreaterThanOrEqual(48);
        expect(cell.left).toBeGreaterThanOrEqual(label.right - 1);
      }
      radios.forEach((radio, index) => {
        expect(Math.abs(center(radio) - center(header[index]!))).toBeLessThan(1);
      });
      expect(row.querySelector('.fh-field__radio-label')!.getBoundingClientRect().width).toBe(0);
    }
    await expectOneLeftEdge();
  });

  it('shows the column label under each radio at 390', async () => {
    await page.viewport(390, 900);
    renderAt(358);
    expect(getComputedStyle(document.querySelector('.fh-section__matrix-header')!).display).toBe('none');
    const row = screen.getByRole('group', { name: 'Friendly' });
    const label = box(row.querySelector('legend')!);
    for (const cell of row.querySelectorAll('.fh-field__radio-option')) {
      const radio = box(cell.querySelector('input')!);
      const caption = box(cell.querySelector('label')!);
      expect(radio.top).toBeGreaterThan(label.bottom - 1);
      expect(caption.width).toBeGreaterThan(0);
      expect(caption.top).toBeGreaterThanOrEqual(radio.bottom);
      expect(Math.abs(center(caption) - center(radio))).toBeLessThan(1);
      expect(box(cell).height).toBeGreaterThanOrEqual(44);
    }
    await expectOneLeftEdge();
  });
});
