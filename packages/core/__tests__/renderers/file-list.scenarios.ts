import type { FormDefinition } from '@formhaus/core';
import type { RendererHarness, TestKit } from './fixtures';

const attachments = (formatVersion: string, multiple = true): FormDefinition => ({
  formatVersion,
  id: 'attachments',
  title: '',
  submit: { label: 'Send' },
  fields: [{ key: 'docs', type: 'file', label: 'Documents', accept: '.pdf', multiple, validation: { required: true } }],
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

  it('does not show references the app supplied and keeps them in the value', async () => {
    const onSubmit = fn();
    harness.mount({ definition: attachments('1.7'), onSubmit, initialValues: { docs: ['upload-1'] } });
    expect(screen.queryAllByRole('listitem')).toEqual([]);
    const [a] = files('a.pdf');
    pick(picker(), [a]);
    await waitFor(() => expect(names()).toEqual(['a.pdf']));
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ docs: ['upload-1', a] }, []));
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
