import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import { FormhausForm } from '../src/cloud';

const definition: FormDefinition = {
  id: 'contact',
  title: 'Contact',
  submit: { label: 'Send' },
  fields: [{ key: 'email', type: 'text', label: 'Email' }],
};

afterEach(() => vi.unstubAllGlobals());

it('renders an initial form, honours its settings and sends the token and honeypot', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 's1', values: {} }) });
  vi.stubGlobal('fetch', fetchMock);
  const initialForm = { definition, version: 2, settings: { successMessage: 'See you soon', allowAnother: true }, renderToken: 'rt_9' };
  render(FormhausForm, { props: { id: 'abc', initialForm } });
  await fireEvent.update(await screen.findByRole('textbox', { name: 'Email' }), 'a@b.co');
  await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  expect(await screen.findByText('See you soon')).toBeDefined();
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ _fh_hp: '', _fh_rt: 'rt_9', version: 2 });
  await fireEvent.click(screen.getByRole('button', { name: 'Submit another response' }));
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Email' })).toBeDefined());
});

it('shows the form success message for another response without an ending', async () => {
  const reply = (body: object) => ({ ok: true, status: 201, json: async () => ({ id: 's1', values: {}, ...body }) });
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(reply({ ending: { successMessage: 'Sales will call you.' } }))
      .mockResolvedValueOnce(reply({})),
  );
  render(FormhausForm, {
    props: { id: 'abc', initialForm: { definition, settings: { successMessage: 'See you soon', allowAnother: true } } },
  });
  await fireEvent.click(await screen.findByRole('button', { name: 'Send' }));
  expect(await screen.findByText('Sales will call you.')).toBeDefined();
  await fireEvent.click(screen.getByRole('button', { name: 'Submit another response' }));
  await fireEvent.click(await screen.findByRole('button', { name: 'Send' }));
  expect(await screen.findByText('See you soon')).toBeDefined();
  expect(screen.queryByText('Sales will call you.')).toBeNull();
});

it('calls a .once handler', async () => {
  vi.stubGlobal('fetch', vi.fn());
  const onFormEventOnce = vi.fn();
  render(FormhausForm, { props: { id: 'abc', initialForm: { definition }, onFormEventOnce } });
  await screen.findByRole('textbox', { name: 'Email' });
  expect(onFormEventOnce).toHaveBeenCalledOnce();
  expect(onFormEventOnce).toHaveBeenCalledWith({ type: 'form_viewed' });
});

it('shows the error summary and asks before removing an answered item by default', async () => {
  vi.stubGlobal('fetch', vi.fn());
  const team: FormDefinition = {
    id: 'team',
    title: 'Team',
    submit: { label: 'Send' },
    fields: [
      { key: 'email', type: 'text', label: 'Email', validation: { required: true } },
      { key: 'crew', type: 'group', label: 'Crew', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
    ],
  };
  render(FormhausForm, { props: { id: 'abc', initialForm: { definition: team }, initialValues: { crew: [{ name: 'Ada' }] } } });
  await fireEvent.click(await screen.findByRole('button', { name: 'Send' }));
  expect(await screen.findByText('Check these answers')).toBeDefined();
  await fireEvent.click(screen.getByRole('button', { name: /Remove/ }));
  expect(await screen.findByRole('dialog')).toBeDefined();
});
