import { fromDefinition, toDefinition } from '@formhaus/builder';
import type { FormDefinition, FormField } from '@formhaus/core';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { EditorHost } from '../host';
import { renderEditor } from './harness';

const EMBEDDED = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="4" height="3"/%3E';
const PIXEL = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAwS2OUAAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0),
);
const UPLOADED = URL.createObjectURL(new Blob([PIXEL], { type: 'image/png' }));

const definition = (field: FormField): FormDefinition => ({ id: 'survey', title: 'Survey', submit: { label: 'Send' }, fields: [field] });
const rooms = (image?: string): FormField => ({
  key: 'room',
  type: 'radio',
  label: 'Room',
  options: [
    { value: 'sea', label: 'Sea', ...(image ? { image } : {}) },
    { value: 'city', label: 'City', image: 'https://cdn.example.com/rooms/city.png' },
  ],
});
const imageOf = (store: { getState: () => { form: Parameters<typeof toDefinition>[0] } }) =>
  ((toDefinition(store.getState().form).fields ?? [])[0] as FormField).options?.[0]?.image;
const png = (size = PIXEL.length, type = 'image/png') =>
  new File([size === PIXEL.length ? PIXEL : new Uint8Array(size)], 'sea.png', { type });

function open(host: Partial<EditorHost> = {}, image?: string) {
  const view = renderEditor(fromDefinition(definition(rooms(image))), { host });
  screen.getByRole('group', { name: 'Room field' }).click();
  return view;
}

const group = () => screen.findByRole('group', { name: 'Image for Sea' });
function fileInput(node: HTMLElement): HTMLInputElement {
  const input = node.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('no file input');
  return input;
}
const noRawSource = () => {
  for (const box of screen.queryAllByRole('textbox')) expect((box as HTMLInputElement).value).not.toMatch(/^data:/);
  expect(document.body.textContent).not.toContain('data:image');
};

function dispatch(target: HTMLElement, event: Event) {
  act(() => {
    target.dispatchEvent(event);
  });
}

const drag = (type: string, data: DataTransfer) => new DragEvent(type, { dataTransfer: data, bubbles: true, cancelable: true });
const paste = (data: DataTransfer) => new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

describe('option images', () => {
  afterEach(() => {
    cleanup();
  });

  it('takes only https links when the host cannot upload', async () => {
    await page.viewport(1280, 900);
    const { store } = open();
    const link = await screen.findByRole('textbox', { name: 'Image link for Sea' });
    expect(screen.queryByRole('button', { name: /Upload image/ })).toBeNull();
    await userEvent.fill(link, EMBEDDED);
    expect(await screen.findByRole('alert')).toHaveTextContent('Use an https link or upload the image');
    expect(link).toHaveValue('');
    for (const bad of ['http://cdn.example.com/sea.png', 'sea.png']) {
      await userEvent.fill(link, bad);
      await userEvent.keyboard('{Enter}');
      expect(await screen.findByRole('alert')).toHaveTextContent('Use an https link or upload the image');
      expect(link).toHaveAttribute('aria-invalid', 'true');
      expect(imageOf(store)).toBeUndefined();
    }
    await userEvent.fill(link, 'https://cdn.example.com/rooms/sea.png');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(imageOf(store)).toBe('https://cdn.example.com/rooms/sea.png');
    });
    const sea = await group();
    expect(within(sea).getByText('sea.png')).toBeVisible();
    expect(within(sea).getByText('cdn.example.com')).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Image link for Sea' })).toBeNull();
    await userEvent.click(within(sea).getByRole('button', { name: 'Edit image link for Sea' }));
    expect(screen.getByRole('textbox', { name: 'Image link for Sea' })).toHaveValue('https://cdn.example.com/rooms/sea.png');
  });

  it('shows an embedded image as a summary and never as text', async () => {
    await page.viewport(1280, 900);
    const { store } = open({}, EMBEDDED);
    const sea = await group();
    expect(within(sea).getByText('Embedded image')).toBeVisible();
    noRawSource();
    await userEvent.click(within(sea).getByRole('button', { name: 'Replace image link for Sea' }));
    expect(screen.getByRole('textbox', { name: 'Image link for Sea' })).toHaveValue('');
    await userEvent.keyboard('{Escape}');
    await userEvent.click(within(sea).getByRole('button', { name: 'Remove image for Sea' }));
    await waitFor(() => {
      expect(imageOf(store)).toBeUndefined();
    });
  });

  it('uploads a picked file, shows progress and the uploaded thumbnail', async () => {
    await page.viewport(1280, 900);
    const pending = deferred<{ url: string }>();
    const uploadImage = vi.fn(() => pending.promise);
    const { store } = open({ uploadImage, isUploadedImage: (url) => url === UPLOADED }, EMBEDDED);
    const sea = await group();
    expect(within(sea).getByText('Embedded image')).toBeVisible();
    await userEvent.upload(fileInput(sea), png());
    expect(uploadImage).toHaveBeenCalledWith(expect.objectContaining({ name: 'sea.png', type: 'image/png' }));
    expect(await within(sea).findByRole('status')).toHaveTextContent('Uploading…');
    expect(sea).toHaveAttribute('aria-busy', 'true');
    expect(within(sea).queryByRole('button')).toBeNull();
    pending.resolve({ url: UPLOADED });
    await waitFor(() => {
      expect(imageOf(store)).toBe(UPLOADED);
    });
    expect(await within(sea).findByText('Uploaded image')).toBeVisible();
    expect(sea.querySelector('img')).toHaveAttribute('src', UPLOADED);
    expect(within(sea).getByRole('button', { name: 'Replace image for Sea' })).toBeVisible();
    noRawSource();
  });

  it('checks type and size before uploading', async () => {
    await page.viewport(1280, 900);
    const uploadImage = vi.fn(() => Promise.resolve({ url: 'https://forms.example/a/w/x.png' }));
    open({ uploadImage });
    const sea = await group();
    fireEvent.change(fileInput(sea), { target: { files: [png(10, 'image/svg+xml')] } });
    expect(await within(sea).findByRole('alert')).toHaveTextContent('Use a PNG, JPEG, WebP or GIF image');
    fireEvent.change(fileInput(sea), { target: { files: [png(5 * 1024 * 1024 + 1)] } });
    expect(await within(sea).findByRole('alert')).toHaveTextContent('Images can be up to 5 MB');
    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('shows a failed upload inline', async () => {
    await page.viewport(1280, 900);
    const uploadImage = vi.fn(() => Promise.reject(new Error('Upload limit reached')));
    const { store } = open({ uploadImage, describeError: (error) => (error as Error).message });
    const sea = await group();
    await userEvent.upload(fileInput(sea), png());
    expect(await within(sea).findByRole('alert')).toHaveTextContent('Upload limit reached');
    expect(imageOf(store)).toBeUndefined();
    expect(within(sea).getByRole('button', { name: 'Upload image for Sea' })).toBeEnabled();
  });

  it('uploads a dropped or pasted image and takes a pasted https link', async () => {
    await page.viewport(1280, 900);
    const uploadImage = vi.fn(() => Promise.resolve({ url: 'https://forms.example/a/w/x.png' }));
    const { store } = open({ uploadImage });
    const sea = await group();
    const dropped = new DataTransfer();
    dropped.items.add(png());
    dispatch(sea, drag('dragover', dropped));
    expect(sea).toHaveAttribute('data-drop', 'true');
    dispatch(sea, drag('drop', dropped));
    await waitFor(() => {
      expect(imageOf(store)).toBe('https://forms.example/a/w/x.png');
    });
    expect(sea).not.toHaveAttribute('data-drop');
    const pasted = new DataTransfer();
    pasted.items.add(png());
    dispatch(sea, paste(pasted));
    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalledTimes(2);
    });
    await userEvent.click(within(sea).getByRole('button', { name: 'Remove image for Sea' }));
    const text = new DataTransfer();
    text.setData('text/plain', EMBEDDED);
    dispatch(sea, paste(text));
    expect(await within(sea).findByRole('alert')).toHaveTextContent('Use an https link or upload the image');
    expect(imageOf(store)).toBeUndefined();
    noRawSource();
    const link = new DataTransfer();
    link.setData('text/plain', 'https://cdn.example.com/rooms/sea.png');
    dispatch(sea, paste(link));
    await waitFor(() => {
      expect(imageOf(store)).toBe('https://cdn.example.com/rooms/sea.png');
    });
  });

  it('opens a link input next to upload and rejects data URIs there', async () => {
    await page.viewport(390, 844);
    const uploadImage = vi.fn(() => Promise.resolve({ url: 'https://forms.example/a/w/x.png' }));
    const { store } = open({ uploadImage });
    const sea = await group();
    await userEvent.click(within(sea).getByRole('button', { name: 'Use a link for Sea' }));
    const link = within(sea).getByRole('textbox', { name: 'Image link for Sea' });
    expect(link).toHaveFocus();
    await userEvent.fill(link, EMBEDDED);
    expect(await within(sea).findByRole('alert')).toHaveTextContent('Use an https link or upload the image');
    expect(link).toHaveValue('');
    await userEvent.fill(link, 'http://cdn.example.com/sea.png');
    await userEvent.keyboard('{Enter}');
    expect(await within(sea).findByRole('alert')).toHaveTextContent('Use an https link or upload the image');
    await userEvent.click(within(sea).getByRole('button', { name: 'Cancel' }));
    expect(within(sea).queryByRole('textbox')).toBeNull();
    expect(imageOf(store)).toBeUndefined();
  });
});
