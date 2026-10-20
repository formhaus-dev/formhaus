import '@formhaus/core/style.css';
import type { FormField } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';

const definition = (...fields: FormField[]) => ({ formatVersion: '1.3', id: 'f', title: 'F', submit: { label: 'Send' }, fields });

function renderAt(width: number, ...fields: FormField[]) {
  render(
    <div style={{ width, fontFamily: 'Georgia, serif' }}>
      <FormRenderer definition={definition(...fields)} onSubmit={() => {}} />
    </div>,
  );
}

const boxes = (selector: string) => [...document.querySelectorAll(selector)].map((node) => node.getBoundingClientRect());
const rows = (rects: DOMRect[]) =>
  [...new Set(rects.map((rect) => Math.round(rect.top)))].map((top) => rects.filter((rect) => Math.round(rect.top) === top).length);

async function pixels(element: Element) {
  const shot = await page.screenshot({ element, save: false });
  const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${shot}`)).blob());
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context = canvas.getContext('2d')!;
  context.drawImage(bitmap, 0, 0);
  const box = element.getBoundingClientRect();
  const scale = bitmap.width / box.width;
  return (x: number, y: number) => [...context.getImageData(Math.floor(x * scale), Math.floor(y * scale), 1, 1).data.slice(0, 3)];
}

const rgb = (color: string) => color.match(/\d+/g)!.slice(0, 3).map(Number);
const near = (actual: number[], expected: number[]) => actual.every((value, index) => Math.abs(value - expected[index]!) <= 2);

const room: FormField = {
  key: 'room',
  type: 'radio',
  label: 'Room',
  options: ['sea', 'garden', 'city', 'loft'].map((value) => ({
    value,
    label: value,
    image:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAEsAQAAAADFzNhvAAAAJklEQVR42u3BMQEAAADCoPVPbQlPoAAAAAAAAAAAAAAAAAAAgKcBO8QAAfyeO9sAAAAASUVORK5CYII=',
  })),
};

describe('picture options', () => {
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
    expect(Math.abs((image.width * 3) / 4 - image.height)).toBeLessThan(1);
    const zoom = boxes('.fh-field__option-zoom')[0]!;
    expect(Math.round(image.right - zoom.right)).toBe(8);
    expect(Math.round(zoom.top - image.top)).toBe(8);
  });

  it('draws a failed image as a rounded surface with no frame', async () => {
    await page.viewport(1280, 800);
    renderAt(640, { ...room, options: room.options!.map((option) => ({ ...option, image: 'http://127.0.0.1:1/missing.png' })) });
    await expect.poll(() => document.querySelectorAll('span.fh-field__option-image').length).toBe(4);
    const card = document.querySelector('.fh-field__radio-option')!;
    const image = card.querySelector('.fh-field__option-image')!;
    const box = image.getBoundingClientRect();
    expect(Math.abs((box.width * 3) / 4 - box.height)).toBeLessThan(1);
    expect(card.querySelector('.fh-field__option-zoom')).toBeNull();
    const surface = rgb(getComputedStyle(image).backgroundColor);
    const paper = rgb(getComputedStyle(card).backgroundColor);
    expect(near(surface, paper)).toBe(false);
    const at = await pixels(card);
    const cardBox = card.getBoundingClientRect();
    const [left, top] = [box.left - cardBox.left, box.top - cardBox.top];
    const [right, bottom] = [left + box.width - 1, top + box.height - 1];
    for (const [x, y] of [
      [left, top],
      [right, top],
      [left, bottom],
      [right, bottom],
    ]) {
      expect(near(at(x!, y!), paper)).toBe(true);
    }
    for (const [x, y] of [
      [left + box.width / 2, top],
      [left + box.width / 2, bottom],
      [left, top + box.height / 2],
      [right, top + box.height / 2],
      [left + 1, top + 6],
      [right - 6, top + 1],
      [left + box.width / 2, top + box.height / 2],
    ]) {
      expect(near(at(x!, y!), surface)).toBe(true);
    }
    expect(screen.getByRole('radio', { name: 'sea' })).toBeTruthy();
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

  it.each([
    [1, 800, [11]],
    [undefined, 276, [6, 5]],
  ])('sizes a scale field inside a flex row item with flex %s', async (flex, width, layout) => {
    await page.viewport(1280, 800);
    const nps: FormField = { key: 'nps', type: 'scale', label: 'Recommend', validation: { min: 0, max: 10 } };
    render(
      <div style={{ display: 'flex', width: 800 }}>
        <div style={{ flex }}>
          <FormRenderer definition={definition(nps)} onSubmit={() => {}} />
        </div>
        <div style={{ flex: flex ? 'none' : 1 }} />
      </div>,
    );
    expect(Math.round(document.querySelector('.fh-field--scale')!.getBoundingClientRect().width)).toBe(width);
    expect(rows(boxes('.fh-field__scale-option'))).toEqual(layout);
  });
});
