import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it, vi } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'auto', title: '', submit: { label: 'Send' }, steps: [
    { id: 'choice', title: 'Choose', next: false, fields: [
      { key: 'choice', type: 'radio', label: 'Choice', autoAdvance: true,
        options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
    ] },
    { id: 'confirm', title: 'Confirm', fields: [
      { key: 'confirm', type: 'radio', label: 'Confirm', autoAdvance: true,
        options: [{ value: 'yes', label: 'Yes' }] },
    ] },
  ],
};

describe('auto advance lifecycle', () => {
  it('hides Next, focuses after activation, preserves Back and does not submit the last radio', async () => {
    const { emitted } = render(FormRenderer, { props: { definition } });
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    await fireEvent.click(screen.getByLabelText('A'));
    const yes = await screen.findByLabelText('Yes');
    await waitFor(() => expect(document.activeElement).toBe(yes));
    await fireEvent.click(yes);
    expect(emitted().submit).toBeUndefined();
    await fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    const a = await screen.findByLabelText('A');
    expect((a as HTMLInputElement).checked).toBe(true);
    await fireEvent.click(a);
    expect(await screen.findByLabelText('Yes')).toBeDefined();
  });

  it('changes selection with arrows without advancing', async () => {
    render(FormRenderer, { props: { definition } });
    const a = screen.getByLabelText('A');
    const b = screen.getByLabelText('B');
    await fireEvent.keyDown(a, { key: 'ArrowRight' });
    await fireEvent.click(b, { detail: 0 });
    await fireEvent.keyUp(b, { key: 'ArrowRight' });
    expect(screen.queryByLabelText('Yes')).toBeNull();
    expect((b as HTMLInputElement).checked).toBe(true);
    await fireEvent.keyDown(b, { key: 'Enter' });
    expect(await screen.findByLabelText('Yes')).toBeDefined();
  });

  it('supports async cancellation, error reporting, updated callbacks and retry', async () => {
    const before = vi.fn(async () => false);
    const onError = vi.fn();
    const { rerender } = render(FormRenderer, { props: { definition, onBeforeStepChange: before, onError } });
    await fireEvent.click(screen.getByLabelText('A'));
    await waitFor(() => expect(before).toHaveBeenCalledTimes(1));
    expect(screen.queryByLabelText('Yes')).toBeNull();
    await rerender({ onBeforeStepChange: () => { throw new Error('Offline'); } });
    await fireEvent.click(screen.getByLabelText('A'));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Offline' })));
    await rerender({ onBeforeStepChange: () => true });
    await fireEvent.click(screen.getByLabelText('A'));
    expect(await screen.findByLabelText('Yes')).toBeDefined();
  });

  it('awaits submitHandler and ignores duplicate submissions', async () => {
    let resolve!: () => void;
    const submitHandler = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    const after = vi.fn();
    const { emitted } = render(FormRenderer, { props: {
      definition: { id: 'single', title: '', submit: { label: 'Send' } }, submitHandler, onAfterSubmit: after,
    } });
    await fireEvent.click(screen.getByText('Send'));
    await fireEvent.click(screen.getByText('Send'));
    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(after).not.toHaveBeenCalled();
    resolve();
    await waitFor(() => expect(after).toHaveBeenCalledTimes(1));
    expect(emitted().submit).toEqual([[{}]]);
  });
});

it('commits an already selected radio on Space without relying on a native change event', async () => {
  render(FormRenderer, { props: { definition, initialValues: { choice: 'a' } } });
  const a = screen.getByLabelText('A');
  await fireEvent.keyDown(a, { key: ' ' });
  await fireEvent.keyUp(a, { key: ' ' });
  expect(await screen.findByLabelText('Yes')).toBeDefined();
});

it('restores focus for retry after an async guard cancels', async () => {
  let cancel!: (allowed: boolean) => void;
  render(FormRenderer, { props: { definition,
    onBeforeStepChange: () => new Promise<boolean>((done) => { cancel = done; }),
  } });
  const a = screen.getByLabelText('A');
  a.focus();
  await fireEvent.click(a);
  a.blur();
  cancel(false);
  await waitFor(() => expect(document.activeElement).toBe(a));
});

it('prevents held Enter from implicitly submitting the final radio', async () => {
  const { emitted } = render(FormRenderer, { props: { definition: { ...definition, steps: [definition.steps![1]] } } });
  const event = new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true });
  screen.getByLabelText('Yes').dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(emitted().submit).toBeUndefined();
});

it('does not pull focus back into the form on unrelated updates', async () => {
  const single: FormDefinition = { id: 'focus', title: '', submit: { label: 'Send' },
    fields: [{ key: 'name', type: 'text', label: 'Name' }] };
  const { rerender } = render(FormRenderer, { props: { definition: single } });
  const input = screen.getByLabelText('Name');
  input.focus();
  input.blur();
  await rerender({ errors: { name: 'Taken' } });
  await screen.findByText('Taken');
  expect(document.activeElement).toBe(document.body);
});
