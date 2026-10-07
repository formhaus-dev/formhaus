import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { FormRenderer } from '../src/FormRenderer';

const definition = { id: 'A', title: '', submit: { label: 'Send' }, fields: [{ key: 'name', label: 'Name', type: 'text' }] };

it.each(['replace', 'unmount'])('discards pending submission on %s', async (action) => {
  let resolve!: () => void;
  const submitA = vi.fn();
  const submitB = vi.fn();
  const before = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
  const view = render(<FormRenderer definition={definition} initialValues={{ name: 'A' }} onBeforeSubmit={before} onSubmit={submitA} />);
  fireEvent.click(screen.getByText('Send'));
  await waitFor(() => expect(before).toHaveBeenCalled());
  if (action === 'replace') view.rerender(<FormRenderer definition={{ ...definition, id: 'B' }} onSubmit={submitB} />);
  else view.unmount();
  resolve();
  await new Promise((done) => setTimeout(done, 0));
  expect(submitA).not.toHaveBeenCalled();
  expect(submitB).not.toHaveBeenCalled();
});

it('honors disabled submit predicates for native form submission', async () => {
  const submit = vi.fn();
  const { container } = render(<FormRenderer definition={{ ...definition,
    submit: { label: 'Send', disabled: [{ field: 'name', eq: 'blocked' }] },
  }} initialValues={{ name: 'blocked' }} onSubmit={submit} />);
  fireEvent.submit(container.querySelector('form')!);
  await Promise.resolve();
  expect(submit).not.toHaveBeenCalled();
});
