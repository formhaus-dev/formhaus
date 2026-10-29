import type { FormDefinition } from '@formhaus/core';
import type { RendererHarness, TestKit } from './fixtures';

const attachments = (formatVersion: string, multiple = true, maxLength?: number): FormDefinition => ({
  formatVersion,
  id: 'attachments',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'docs', type: 'file', label: 'Documents', accept: '.pdf', multiple, validation: { required: true, maxLength } }],
});

const files = (...names: string[]) => names.map((name) => new File(['x'], name));

function pick(input: HTMLElement, picked: File[]): void {
  Object.defineProperty(input, 'files', { value: picked, configurable: true });
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

export function fileListScenarios(harness: RendererHarness, { it, expect, waitFor, fn, screen }: TestKit): void {
  const picker = () => document.querySelector<HTMLInputElement>('input[type="file"]')!;
  const names = () => screen.queryAllByRole('listitem').map((item) => item.firstElementChild?.textContent);
  const status = () => document.querySelector('.fh-file-list__status')?.textContent?.trim();

  it('adds picked files to the list, announces them and submits them in order', async () => {
    const onSubmit = fn();
    harness.mount({ definition: attachments('1.7'), onSubmit });
    expect([picker().multiple, picker().accept]).toEqual([true, '.pdf']);
    const [a, b, c] = files('a.pdf', 'b.pdf', 'c.pdf');
    pick(picker(), [a, b]);
    await waitFor(() => expect(names()).toEqual(['a.pdf', 'b.pdf']));
    expect(status()).toBe('a.pdf, b.pdf added');
    pick(picker(), [c]);
    await waitFor(() => expect(names()).toEqual(['a.pdf', 'b.pdf', 'c.pdf']));
    expect(picker().value).toBe('');
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ docs: [a, b, c] }, []));
  });

  it('removes a file, announces it and moves focus to the next Remove button', async () => {
    harness.mount({ definition: attachments('1.7'), onSubmit: fn() });
    pick(picker(), files('a.pdf', 'b.pdf', 'c.pdf'));
    await harness.click(await screen.findByRole('button', { name: 'Remove b.pdf' }));
    await waitFor(() => expect(names()).toEqual(['a.pdf', 'c.pdf']));
    expect(status()).toBe('b.pdf removed');
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove c.pdf' })));
    await harness.click(screen.getByRole('button', { name: 'Remove c.pdf' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove a.pdf' })));
    await harness.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
    await waitFor(() => expect(document.activeElement).toBe(picker()));
    expect(screen.queryAllByRole('list')).toEqual([]);
  });

  it('requires at least one file after the last one is removed', async () => {
    const onSubmit = fn();
    harness.mount({ definition: attachments('1.7'), onSubmit });
    pick(picker(), files('a.pdf'));
    await harness.click(await screen.findByRole('button', { name: 'Remove a.pdf' }));
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByText('This field is required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('lists references the app supplied by their last path segment and keeps them in the value', async () => {
    const onSubmit = fn();
    harness.mount({ definition: attachments('1.7'), onSubmit, initialValues: { docs: ['upload-1', 'file:///Users/x/cv.pdf'] } });
    expect(names()).toEqual(['upload-1', 'cv.pdf']);
    expect(document.querySelector('.fh-file-list a')).toBeNull();
    const [a] = files('a.pdf');
    pick(picker(), [a]);
    await waitFor(() => expect(names()).toEqual(['upload-1', 'cv.pdf', 'a.pdf']));
    await harness.click(screen.getByRole('button', { name: 'Remove upload-1' }));
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ docs: ['file:///Users/x/cv.pdf', a] }, []));
  });

  it('stops at the file limit, drops the extra files and says why', async () => {
    const onSubmit = fn();
    harness.mount({ definition: attachments('1.7', true, 3), onSubmit, initialValues: { docs: ['upload-1'] } });
    const [a, b, c] = files('a.pdf', 'b.pdf', 'c.pdf');
    pick(picker(), [a, b, c]);
    await waitFor(() => expect(names()).toEqual(['upload-1', 'a.pdf', 'b.pdf']));
    expect(status()).toBe('a.pdf, b.pdf added At most 3 allowed');
    expect(document.querySelector('.fh-file-list__notice')?.textContent).toBe('At most 3 allowed');
    expect(picker().disabled).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Remove b.pdf' })));
    await harness.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
    await waitFor(() => expect(picker().disabled).toBe(false));
    expect(document.querySelector('.fh-file-list__notice')).toBeNull();
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ docs: ['upload-1', b] }, []));
  });

  it('keeps a file list in a frozen definition that also has a group', () => {
    const definition = attachments('1.7');
    const group = { key: 'people', type: 'group', label: 'People', fields: [Object.freeze({ key: 'name', type: 'text', label: 'Name' })] };
    definition.fields!.push(Object.freeze(group) as never);
    Object.freeze(definition.fields![0]);
    harness.mount({ definition: Object.freeze(definition), onSubmit: fn() });
    expect(picker().multiple).toBe(true);
  });

  it('keeps a frozen definition a file list, also with recall in its texts', () => {
    const definition = attachments('1.7');
    const [field] = definition.fields!;
    Object.freeze(Object.assign(field, { helperText: 'Files for {{docs}}' }));
    harness.mount({ definition: Object.freeze(definition), onSubmit: fn() });
    expect(picker().multiple).toBe(true);
  });

  it('keeps one file below format 1.7', async () => {
    const onSubmit = fn();
    harness.mount({ definition: attachments('1.6'), onSubmit });
    expect(picker().multiple).toBe(false);
    const [a] = files('a.pdf');
    pick(picker(), [a]);
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ docs: a }, []));
    expect(document.querySelector('.fh-file-list__status')).toBeNull();
  });
}
