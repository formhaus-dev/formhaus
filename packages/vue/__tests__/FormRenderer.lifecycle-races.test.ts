import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { expect, it, vi } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition = { id: 'A', title: '', submit: { label: 'Send' }, fields: [{ key: 'name', label: 'Name', type: 'text' }] };

it.each(['replace', 'unmount'])('discards pending submission on %s', async (action) => {
  let resolve!: () => void;
  const submitA = vi.fn();
  const submitB = vi.fn();
  const before = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
  const view = render(FormRenderer, { props: { definition, initialValues: { name: 'A' }, onBeforeSubmit: before, submitHandler: submitA } });
  await fireEvent.click(screen.getByText('Send'));
  await waitFor(() => expect(before).toHaveBeenCalled());
  if (action === 'replace') await view.rerender({ definition: { ...definition, id: 'B' }, submitHandler: submitB });
  else view.unmount();
  resolve();
  await new Promise((done) => setTimeout(done, 0));
  expect(submitA).not.toHaveBeenCalled();
  expect(submitB).not.toHaveBeenCalled();
});

it('honors disabled submit predicates for native form submission', async () => {
  const submitHandler = vi.fn();
  const { container } = render(FormRenderer, { props: {
    definition: { ...definition, submit: { label: 'Send', disabled: [{ field: 'name', eq: 'blocked' }] } },
    initialValues: { name: 'blocked' }, submitHandler,
  } });
  await fireEvent.submit(container.querySelector('form')!);
  expect(submitHandler).not.toHaveBeenCalled();
});
