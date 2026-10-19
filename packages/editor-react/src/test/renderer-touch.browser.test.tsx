import '@formhaus/core/style.css';
import type { FormField } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp, page } from 'vitest/browser';

const definition = (field: FormField) => ({ formatVersion: '1.3', id: 'f', title: 'F', submit: { label: 'Send' }, fields: [field] });

function renderAt(width: number, field: FormField) {
  render(
    <div style={{ width, fontFamily: 'Georgia, serif' }}>
      <FormRenderer definition={definition(field)} onSubmit={() => {}} />
    </div>,
  );
}

const boxes = (selector: string) => [...document.querySelectorAll(selector)].map((node) => node.getBoundingClientRect());
const rows = (rects: DOMRect[]) =>
  [...new Set(rects.map((rect) => Math.round(rect.top)))].map((top) => rects.filter((rect) => Math.round(rect.top) === top).length);

const nps: FormField = {
  key: 'nps',
  type: 'scale',
  label: 'Recommend',
  validation: { min: 0, max: 10 },
  options: [
    { value: '0', label: 'Not at all likely' },
    { value: '10', label: 'Extremely likely' },
  ],
};

const stars = (max: number): FormField => ({
  key: 'stars',
  type: 'rating',
  label: 'Rate',
  validation: { max },
  options: [
    { value: '1', label: 'Awful' },
    { value: String(max), label: 'Perfect' },
  ],
});

describe('touch targets at 390px', () => {
  afterEach(async () => {
    cleanup();
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: false });
  });

  it('wraps 0 to 10 into rows of 6 and 5 with 44px points and anchors on the row edges', async () => {
    await page.viewport(390, 800);
    renderAt(358, nps);
    const points = boxes('.fh-field__scale-option');
    expect(rows(points)).toEqual([6, 5]);
    for (const point of points) {
      expect(point.width).toBeGreaterThanOrEqual(44);
      expect(point.height).toBeGreaterThanOrEqual(44);
    }
    const texts = [...document.querySelectorAll('.fh-field__scale-anchor')].map((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect();
    });
    const [start, end] = [texts[0], texts.at(-1)];
    expect(Math.round(start!.left)).toBe(Math.round(points[0]!.left));
    expect(Math.round(end!.right)).toBe(Math.round(points[10]!.right));
    expect(screen.getAllByRole('radio')).toHaveLength(11);
  });

  it('keeps 0 to 10 on one row when it fits', async () => {
    await page.viewport(1280, 800);
    renderAt(640, nps);
    expect(rows(boxes('.fh-field__scale-option'))).toEqual([11]);
  });

  it('gives each star a 44px hit area on touch and keeps them 4px apart', async () => {
    await cdp().send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await page.viewport(390, 800);
    expect(matchMedia('(pointer: coarse)').matches).toBe(true);
    for (const max of [5, 10]) {
      renderAt(358, stars(max));
      const hits = boxes('.fh-field__scale-input');
      const glyphs = boxes('.fh-field__scale-label');
      expect(rows(hits)).toEqual(max === 10 ? [5, 5] : [5]);
      for (const hit of hits) {
        expect(hit.width).toBeGreaterThanOrEqual(44);
        expect(hit.height).toBeGreaterThanOrEqual(44);
      }
      expect(Math.round(glyphs[1]!.left - glyphs[0]!.right)).toBe(4);
      cleanup();
    }
  });

  it('packs stars 4px apart with the anchors under the first and last star', async () => {
    await page.viewport(1280, 800);
    renderAt(640, stars(5));
    const glyphs = boxes('.fh-field__scale-label');
    expect(Math.round(glyphs[1]!.left - glyphs[0]!.right)).toBe(4);
    const anchors = boxes('.fh-field__scale-anchor');
    const [start, end] = [anchors[0], anchors.at(-1)];
    expect(Math.round(start!.left)).toBe(Math.round(glyphs[0]!.left));
    expect(Math.round(end!.right)).toBe(Math.round(glyphs[4]!.right));
  });
});

describe('picture options', () => {
  const room: FormField = {
    key: 'room',
    type: 'radio',
    label: 'Room',
    options: ['sea', 'garden', 'city', 'loft'].map((value) => ({
      value,
      label: value,
      image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"/%3E',
    })),
  };

  afterEach(() => {
    cleanup();
  });

  it.each([
    [undefined, 1280, 640, 3],
    [2, 1280, 640, 2],
    [4, 1280, 640, 4],
    [4, 390, 358, 2],
    [1, 390, 358, 1],
    [undefined, 390, 358, 2],
  ])('columns %s at %ipx shows %#', async (columns, viewport, width, expected) => {
    await page.viewport(viewport, 800);
    renderAt(width, { ...room, columns });
    const cards = boxes('.fh-field__radio-option');
    expect(rows(cards)[0]).toBe(expected);
    const image = boxes('.fh-field__option-image')[0]!;
    expect(Math.round((image.width * 3) / 4)).toBe(Math.round(image.height));
  });

  it('opens the preview in the form font and theme without selecting the option', async () => {
    await page.viewport(1280, 800);
    renderAt(640, room);
    const form = document.querySelector('.fh-form')!;
    form.setAttribute('data-fh-theme', 'dark');
    const trigger = screen.getByRole('button', { name: 'Enlarge image: sea' });
    trigger.click();
    const dialog = screen.getByRole('dialog', { name: 'sea' });
    expect((dialog as HTMLDialogElement).open).toBe(true);
    expect(getComputedStyle(dialog).fontFamily).toBe(getComputedStyle(form).fontFamily);
    expect(getComputedStyle(form).fontFamily).toContain('Georgia');
    expect(getComputedStyle(dialog).backgroundColor).toBe('rgb(24, 24, 28)');
    expect((screen.getByRole('radio', { name: 'sea' }) as HTMLInputElement).checked).toBe(false);
    (dialog.querySelector('.fh-dialog__close') as HTMLButtonElement).click();
    expect((dialog as HTMLDialogElement).open).toBe(false);
    await expect.poll(() => document.activeElement).toBe(trigger);
  });
});
