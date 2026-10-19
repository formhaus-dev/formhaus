import type { FormDefinition, FormField } from '@formhaus/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

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
    render(<FormRenderer definition={single(room, { ...room, key: 'auto', columns: undefined })} onSubmit={() => {}} />);
    const groups = document.querySelectorAll('.fh-field__radio-group');
    expect(groups[0].getAttribute('data-columns')).toBe('2');
    expect(groups[1].hasAttribute('data-columns')).toBe(false);
  });

  it('opens the image without selecting the option and returns focus on close', () => {
    render(<FormRenderer definition={single(room)} onSubmit={() => {}} />);
    const trigger = screen.getByRole('button', { name: 'Enlarge image: Sea view' });
    fireEvent.click(trigger);
    const dialog = trigger.parentElement!.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute('aria-label')).toBe('Sea view');
    expect(dialog.querySelector('img')!.getAttribute('src')).toBe('https://example.com/sea.jpg');
    expect((screen.getByRole('radio', { name: 'Sea view' }) as HTMLInputElement).checked).toBe(false);
    fireEvent.click(dialog.querySelector('.fh-dialog__close')!);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a backdrop click only', () => {
    render(<FormRenderer definition={single(room)} onSubmit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enlarge image: Garden' }));
    const dialog = document.querySelectorAll('dialog')[1];
    fireEvent.click(dialog.querySelector('img')!);
    expect(dialog.open).toBe(true);
    fireEvent.click(dialog);
    expect(dialog.open).toBe(false);
  });

  it('keeps keys pressed in the preview away from the host page', () => {
    const host = vi.fn();
    document.addEventListener('keydown', host);
    render(<FormRenderer definition={single(room)} onSubmit={() => {}} />);
    fireEvent.keyDown(document.querySelector('dialog')!, { key: 'Escape' });
    document.removeEventListener('keydown', host);
    expect(host).not.toHaveBeenCalled();
  });

  it('renders no preview for options without images', () => {
    render(<FormRenderer definition={single({ ...room, options: [{ value: 'a', label: 'A' }] })} onSubmit={() => {}} />);
    expect(document.querySelector('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: /Enlarge/ })).toBeNull();
  });
});
