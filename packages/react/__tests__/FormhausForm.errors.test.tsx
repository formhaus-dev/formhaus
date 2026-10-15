import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import { FormhausForm } from '../src/cloud';

const v1: FormDefinition = {
  id: 'feedback',
  title: 'Feedback',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    {
      key: 'topic',
      type: 'radio',
      label: 'Topic',
      options: [
        { value: 'bug', label: 'Bug' },
        { value: 'idea', label: 'Idea' },
      ],
    },
  ],
};

const v2: FormDefinition = {
  ...v1,
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    {
      key: 'topic',
      type: 'multiselect',
      label: 'Topics',
      options: [
        { value: 'bug', label: 'Bug' },
        { value: 'idea', label: 'Idea' },
      ],
    },
  ],
};

function reply(status: number, body: unknown, version?: number) {
  return { ok: status < 400, status, json: async () => body, headers: { get: () => (version ? String(version) : null) } };
}

function stub(...replies: Array<ReturnType<typeof reply> | Error>) {
  const queue = [...replies];
  const fetchMock = vi.fn(async () => {
    const next = queue.shift()!;
    if (next instanceof Error) throw next;
    return next;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function fillAndSend() {
  fireEvent.change(await screen.findByLabelText('Name'), { target: { value: 'Ada' } });
  fireEvent.click(screen.getByLabelText('Bug'));
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
}

afterEach(() => vi.unstubAllGlobals());

it('re-renders the updated form, keeps compatible values and announces it', async () => {
  const fetchMock = stub(
    reply(200, v1, 1),
    reply(409, { error: 'form_updated', version: 2, errors: { topic: 'Must be a list' } }),
    reply(200, v2, 2),
  );
  const onError = vi.fn();
  render(<FormhausForm id="abc" onError={onError} />);
  await fillAndSend();
  expect(await screen.findByText('This form was updated. Please review your answers and submit again.')).toBeDefined();
  expect(await screen.findByText('Topics')).toBeDefined();
  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Ada');
  expect((screen.getByLabelText('Bug') as HTMLInputElement).checked).toBe(false);
  expect(screen.queryByText('Must be a list')).toBeNull();
  expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).version).toBe(1);
  expect(fetchMock.mock.calls[2][0]).toMatch(/^https:\/\/api\.formhaus\.cc\/f\/abc\/form\?core=.*&v=2$/);
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'form_updated' }));
  await waitFor(() => expect(document.activeElement?.className).toContain('fh-form__notice'));
  expect(screen.getAllByText('Please answer again.')).toHaveLength(1);
});

it('shows a retryable notice on a network failure and keeps the values', async () => {
  stub(reply(200, v1, 1), new TypeError('Failed to fetch'), reply(201, { id: 's1', values: {} }));
  render(<FormhausForm id="abc" />);
  await fillAndSend();
  expect(await screen.findByText(/Could not reach the form server/)).toBeDefined();
  expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Ada');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('status')).toBeDefined();
});

it('focuses the first invalid field when there is no notice', async () => {
  stub(reply(200, v1, 1), reply(422, { errors: { name: 'Taken' } }));
  render(<FormhausForm id="abc" />);
  await fillAndSend();
  expect(await screen.findByText('Taken')).toBeDefined();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Name')));
});

it('shows a notice for server errors without a retry for a paused form', async () => {
  stub(reply(200, v1, 1), reply(409, { error: 'paused' }));
  render(<FormhausForm id="abc" />);
  await fillAndSend();
  expect(await screen.findByText(/This form is paused/)).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
});

it('lists messages for keys the form does not render without the key and focuses the notice', async () => {
  stub(reply(200, v1, 1), reply(422, { errors: { name: 'Taken', referral: 'Unknown code' } }));
  render(<FormhausForm id="abc" />);
  await fillAndSend();
  expect(await screen.findByText('Unknown code')).toBeDefined();
  expect(screen.queryByText(/referral/)).toBeNull();
  await waitFor(() => expect(document.activeElement?.className).toContain('fh-form__notice'));
});
