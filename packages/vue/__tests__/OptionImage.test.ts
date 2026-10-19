import type { FormDefinition, FormField } from '@formhaus/core';
import { cleanup, fireEvent, render, screen } from '@testing-library/vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const room: FormField = {
  key: 'room',
  type: 'radio',
  label: 'Room',
  columns: 2,
  options: [
    { value: 'sea', label: 'Sea view', image: 'https://example.com/sea.jpg' },
    { value: 'garden', label: 'Garden', image: 'https://example.com/garden.jpg' },
  ],
};

const single = (...fields: FormField[]): FormDefinition => ({
  formatVersion: '1.3',
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  fields,
});

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('picture option preview', () => {
  it('puts columns on the option group', () => {
    render(FormRenderer, { props: { definition: single(room, { ...room, key: 'auto', columns: undefined }), onSubmit: () => {} } });
    const groups = document.querySelectorAll('.fh-field__radio-group');
    expect(groups[0].getAttribute('data-columns')).toBe('2');
    expect(groups[1].hasAttribute('data-columns')).toBe(false);
  });

  it('opens the image without selecting the option and returns focus on close', async () => {
    render(FormRenderer, { props: { definition: single(room), onSubmit: () => {} } });
    const trigger = screen.getByRole('button', { name: 'Enlarge image: Sea view' });
    await fireEvent.click(trigger);
    const dialog = trigger.parentElement!.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Sea view');
    expect(dialog.querySelector('img')!.getAttribute('src')).toBe('https://example.com/sea.jpg');
    expect((screen.getByRole('radio', { name: 'Sea view' }) as HTMLInputElement).checked).toBe(false);
    await fireEvent.click(dialog.querySelector('.fh-dialog__close')!);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a backdrop click only', async () => {
    render(FormRenderer, { props: { definition: single(room), onSubmit: () => {} } });
    await fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Garden' }));
    const dialog = document.querySelectorAll('dialog')[1];
    await fireEvent.pointerDown(dialog.querySelector('img')!);
    await fireEvent.click(dialog.querySelector('img')!);
    expect(dialog.open).toBe(true);
    await fireEvent.click(dialog);
    expect(dialog.open).toBe(true);
    await fireEvent.pointerDown(dialog);
    await fireEvent.click(dialog);
    expect(dialog.open).toBe(false);
  });

  it('stays open when a drag from the image ends on the backdrop', async () => {
    render(FormRenderer, { props: { definition: single(room), onSubmit: () => {} } });
    await fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Sea view' }));
    const dialog = document.querySelector('dialog')!;
    await fireEvent.pointerDown(dialog.querySelector('.fh-dialog__title')!);
    await fireEvent.click(dialog);
    expect(dialog.open).toBe(true);
  });

  it('puts the zoom button after the option input and label', () => {
    render(FormRenderer, { props: { definition: single(room), onSubmit: () => {} } });
    const option = document.querySelector('.fh-field__radio-option')!;
    const order = [...option.children].map((node) => node.className || node.tagName.toLowerCase());
    expect(order.slice(0, 4)).toEqual(['fh-field__radio', 'fh-field__radio-label', 'fh-field__option-image', 'fh-field__option-zoom']);
    const focusable = [...document.querySelectorAll('input, button:not(dialog button)')].slice(0, 2);
    expect(focusable[0]).toBe(screen.getByRole('radio', { name: 'Sea view' }));
    expect(focusable[1]).toBe(screen.getByRole('button', { name: 'Enlarge image: Sea view' }));
  });

  it('draws a plain surface without a preview when the image fails to load', async () => {
    const { rerender } = render(FormRenderer, { props: { definition: single(room), onSubmit: () => {} } });
    await fireEvent.error(document.querySelector('img.fh-field__option-image')!);
    const option = document.querySelector('.fh-field__radio-option')!;
    expect(option.querySelector('span.fh-field__option-image')).toBeTruthy();
    expect(option.querySelector('img, .fh-field__option-zoom, dialog')).toBeNull();
    expect(screen.getByRole('radio', { name: 'Sea view' })).toBeTruthy();
    const options = room.options!.map((option) => ({ ...option, image: `${option.image}?v=2` }));
    await rerender({ definition: single({ ...room, options }) });
    expect(document.querySelector('img.fh-field__option-image')!.getAttribute('src')).toBe('https://example.com/sea.jpg?v=2');
  });

  it('keeps keys pressed in the preview away from the host page', async () => {
    const host = vi.fn();
    document.addEventListener('keydown', host);
    render(FormRenderer, { props: { definition: single(room), onSubmit: () => {} } });
    await fireEvent.keyDown(document.querySelector('dialog')!, { key: 'Escape' });
    document.removeEventListener('keydown', host);
    expect(host).not.toHaveBeenCalled();
  });

  it('takes the button names from the labels catalog', () => {
    render(FormRenderer, { props: { definition: single(room), labels: { enlargeImage: 'Увеличить: {label}' }, onSubmit: () => {} } });
    expect(screen.getByRole('button', { name: 'Увеличить: Sea view' })).toBeTruthy();
    cleanup();
    render(FormRenderer, { props: { definition: { ...single(room), labels: { close: 'Закрыть' } }, onSubmit: () => {} } });
    expect(screen.getAllByRole('button', { name: 'Закрыть', hidden: true })).toHaveLength(2);
  });

  it('hides the focus ring of the close button after a pointer click until a key is pressed', async () => {
    render(FormRenderer, { props: { definition: single(room), onSubmit: () => {} } });
    const trigger = screen.getByRole('button', { name: 'Enlarge image: Sea view' });
    const dialog = trigger.parentElement!.querySelector('dialog')!;
    await fireEvent.click(trigger, { detail: 1 });
    expect(dialog.hasAttribute('data-pointer')).toBe(true);
    await fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(dialog.hasAttribute('data-pointer')).toBe(false);
    await fireEvent.click(trigger, { detail: 0 });
    expect(dialog.hasAttribute('data-pointer')).toBe(false);
  });

  it('renders no preview for options without images', () => {
    render(FormRenderer, { props: { definition: single({ ...room, options: [{ value: 'a', label: 'A' }] }), onSubmit: () => {} } });
    expect(document.querySelector('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: /Enlarge/ })).toBeNull();
  });
});
