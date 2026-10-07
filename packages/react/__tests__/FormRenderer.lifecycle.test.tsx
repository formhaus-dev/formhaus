import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const definition: FormDefinition = {
  id: 'auto', title: 'Auto', submit: { label: 'Send' }, steps: [
    { id: 'choice', title: 'Choose', next: false, fields: [
      { key: 'choice', type: 'radio', label: 'Choice', autoAdvance: true,
        helperText: 'Click an option or press Space to continue. Arrow keys only select.',
        options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
    ] },
    { id: 'confirm', title: 'Confirm', fields: [
      { key: 'confirm', type: 'radio', label: 'Confirm', autoAdvance: true,
        options: [{ value: 'yes', label: 'Yes' }] },
    ] },
  ],
};

describe('auto advance and lifecycle', () => {
  it('advances on activation without Next, focuses the next step, and never submits a radio', async () => {
    const onSubmit = vi.fn();
    const onStepChange = vi.fn();
    render(<FormRenderer definition={definition} onSubmit={onSubmit} onStepChange={onStepChange} />);
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    fireEvent.click(screen.getByLabelText('A'));
    const radio = await screen.findByLabelText('Yes');
    await waitFor(() => expect(document.activeElement).toBe(radio));
    expect(onStepChange).toHaveBeenCalledWith('confirm', 'next');
    fireEvent.click(radio);
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    const selected = await screen.findByLabelText('A');
    expect((selected as HTMLInputElement).checked).toBe(true);
    fireEvent.click(selected);
    expect(await screen.findByLabelText('Yes')).toBeDefined();
  });

  it('keeps arrow-key selection on the step until explicit Space/click activation', async () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    const a = screen.getByLabelText('A');
    const b = screen.getByLabelText('B');
    fireEvent.keyDown(a, { key: 'ArrowRight' });
    fireEvent.click(b, { detail: 0 });
    fireEvent.keyUp(b, { key: 'ArrowRight' });
    expect(screen.queryByLabelText('Yes')).toBeNull();
    expect((b as HTMLInputElement).checked).toBe(true);
    fireEvent.click(b, { detail: 0 });
    expect(await screen.findByLabelText('Yes')).toBeDefined();
  });

  it('supports cancelling and retrying a selection, and catches hook errors', async () => {
    let allow = false;
    const before = vi.fn(() => allow);
    const onError = vi.fn();
    const { rerender } = render(<FormRenderer definition={definition} onSubmit={() => {}}
      onBeforeStepChange={before} onError={onError} />);
    fireEvent.click(screen.getByLabelText('A'));
    await waitFor(() => expect(before).toHaveBeenCalledTimes(1));
    expect(screen.queryByLabelText('Yes')).toBeNull();
    rerender(<FormRenderer definition={definition} onSubmit={() => {}} onError={onError}
      onBeforeStepChange={() => { throw new Error('Offline'); }} />);
    fireEvent.click(screen.getByLabelText('A'));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Offline' })));
    allow = true;
    rerender(<FormRenderer definition={definition} onSubmit={() => {}} onBeforeStepChange={before} />);
    fireEvent.click(screen.getByLabelText('A'));
    expect(await screen.findByLabelText('Yes')).toBeDefined();
  });

  it('awaits submission before afterSubmit and blocks rapid duplicate submits', async () => {
    let resolve!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    const after = vi.fn();
    render(<FormRenderer definition={{ id: 'single', title: '', submit: { label: 'Send' } }}
      onSubmit={onSubmit} onAfterSubmit={after} />);
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(after).not.toHaveBeenCalled();
    resolve();
    await waitFor(() => expect(after).toHaveBeenCalledTimes(1));
  });
});

it('commits an already selected radio on Space without relying on a native change event', async () => {
  render(<FormRenderer definition={definition} initialValues={{ choice: 'a' }} onSubmit={() => {}} />);
  const a = screen.getByLabelText('A');
  fireEvent.keyDown(a, { key: ' ' });
  fireEvent.keyUp(a, { key: ' ' });
  expect(await screen.findByLabelText('Yes')).toBeDefined();
});

it('restores focus for retry after an async guard cancels', async () => {
  let cancel!: (allowed: boolean) => void;
  render(<FormRenderer definition={definition} onSubmit={() => {}}
    onBeforeStepChange={() => new Promise<boolean>((done) => { cancel = done; })} />);
  const a = screen.getByLabelText('A');
  a.focus();
  fireEvent.click(a);
  a.blur();
  cancel(false);
  await waitFor(() => expect(document.activeElement).toBe(a));
});

it('prevents held Enter from implicitly submitting the final radio', () => {
  const send = vi.fn();
  render(<FormRenderer definition={{ ...definition, steps: [definition.steps![1]] }} onSubmit={send} />);
  const allowed = fireEvent.keyDown(screen.getByLabelText('Yes'), { key: 'Enter', repeat: true });
  expect(allowed).toBe(false);
  expect(send).not.toHaveBeenCalled();
});

it('does not pull focus back into the form on unrelated updates', async () => {
  const single: FormDefinition = { id: 'focus', title: '', submit: { label: 'Send' },
    fields: [{ key: 'name', type: 'text', label: 'Name' }] };
  const { rerender } = render(<FormRenderer definition={single} onSubmit={() => {}} />);
  const input = screen.getByLabelText('Name');
  input.focus();
  input.blur();
  rerender(<FormRenderer definition={single} onSubmit={() => {}} errors={{ name: 'Taken' }} />);
  await screen.findByText('Taken');
  expect(document.activeElement).toBe(document.body);
});
