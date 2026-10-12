import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import { FormhausForm } from '../src/cloud';

const definition: FormDefinition = { id: 'contact', title: 'Contact', submit: { label: 'Send' }, fields: [{ key: 'email', type: 'text', label: 'Email' }] };

afterEach(() => vi.unstubAllGlobals());

it('renders an initial form, honours its settings and sends the token and honeypot', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 's1', values: {} }) });
  vi.stubGlobal('fetch', fetchMock);
  const initialForm = { definition, version: 2, settings: { successMessage: 'See you soon', allowAnother: true }, renderToken: 'rt_9' };
  render(<FormhausForm id="abc" initialForm={initialForm} />);
  fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), { target: { value: 'a@b.co' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  expect(await screen.findByText('See you soon')).toBeDefined();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ _fh_hp: '', _fh_rt: 'rt_9', version: 2 });
  fireEvent.click(screen.getByRole('button', { name: 'Submit another response' }));
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Email' })).toBeDefined());
});

it('redirects after a submission when the form has a redirect URL', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ id: 's1', values: {} }) }));
  const assign = vi.fn();
  vi.stubGlobal('location', { ...window.location, assign });
  render(<FormhausForm id="abc" initialForm={{ definition, settings: { redirectUrl: 'https://example.com/thanks' } }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(assign).toHaveBeenCalledWith('https://example.com/thanks'));
});
