import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { expect, it } from 'vitest';
import FormRenderer from '../src/FormRenderer.vue';

const definition: FormDefinition = {
  id: 'submit-disabled', title: '', submit: { label: 'Send', disabled: [{ field: 'blocked', notEmpty: true }] },
  steps: [
    { id: 'kind', title: 'Kind', fields: [{ key: 'kind', type: 'select', label: 'Kind', options: [{ value: 'biz', label: 'Biz' }, { value: 'me', label: 'Me' }] }], routes: [{ to: 'biz', show: [{ field: 'kind', eq: 'biz' }] }, { to: 'me' }] },
    { id: 'biz', title: 'Biz', fields: [{ key: 'blocked', type: 'text', label: 'Blocked' }], routes: [{ to: null }] },
    { id: 'me', title: 'Me', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  ],
};

it('evaluates submit.disabled against the active path, not off-path values', async () => {
  render(FormRenderer, { props: { definition, initialValues: { kind: 'me', blocked: 'x' } } });
  (screen.getByText('Continue') as HTMLButtonElement).click();
  const send = await screen.findByText('Send');
  await waitFor(() => expect((send as HTMLButtonElement).disabled).toBe(false));
});

const gated: FormDefinition = {
  id: 'next-disabled', title: '', submit: { label: 'Send' },
  steps: [
    { id: 'terms', title: 'Terms', next: { label: 'Go on', disabled: [{ field: 'agree', neq: true }] }, fields: [{ key: 'agree', type: 'checkbox', label: 'Agree' }] },
    { id: 'done', title: 'Done', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  ],
};

it('disables Continue while next.disabled matches and does not advance on Enter', async () => {
  const { container } = render(FormRenderer, { props: { definition: gated } });
  const next = screen.getByText('Go on') as HTMLButtonElement;
  expect(next.disabled).toBe(true);
  await fireEvent.submit(container.querySelector('form')!);
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(screen.queryByText('Name')).toBeNull();
  await fireEvent.click(screen.getByLabelText('Agree'));
  await waitFor(() => expect(next.disabled).toBe(false));
  await fireEvent.click(next);
  expect(await screen.findByText('Name')).toBeTruthy();
});
