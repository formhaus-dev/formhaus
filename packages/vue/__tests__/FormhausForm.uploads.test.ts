import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import FormhausForm from '../src/cloud/FormhausForm.vue';

const ORIGIN = 'https://formhaus.cc';
const definition: FormDefinition = {
  id: 'apply',
  title: 'Apply',
  submit: { label: 'Send' },
  fields: [{ key: 'cv', type: 'file', label: 'CV' }],
};
const challenge = { provider: 'turnstile', siteKey: '0x4AAA', url: `${ORIGIN}/challenge?form=abc` };

function reply(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body, headers: { get: () => null } };
}

const gone = () => reply(422, { error: 'invalid', errors: { cv: 'Upload the file again.' } });
const done = () => reply(201, { id: 's1', values: {} });

function api(answers: unknown[], held = false) {
  let tickets = 0;
  let release = () => {};
  const fetchMock = vi.fn(async (url: string, init?: { method?: string; body?: unknown }) => {
    if (url.includes('/uploads')) {
      tickets += 1;
      return reply(201, { id: `up-${tickets}`, url: 'https://objects.test/k', method: 'PUT', headers: {} });
    }
    if (init?.method === 'PUT') {
      if (held) await new Promise<void>((resolve) => (release = resolve));
      return reply(200, null);
    }
    const answer = answers.shift();
    if (answer instanceof Error) throw answer;
    return answer;
  });
  vi.stubGlobal('fetch', fetchMock);
  const submits = () =>
    fetchMock.mock.calls
      .filter(([url, init]) => init?.method === 'POST' && !url.includes('/uploads'))
      .map(([, init]) => ({
        body: JSON.parse(init!.body as string),
        key: (init as unknown as { headers: Record<string, string> }).headers['Idempotency-Key'],
      }));
  return { fetchMock, submits, tickets: () => tickets, release: () => release() };
}

const answer = (frame: HTMLIFrameElement, token: string) =>
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'formhaus:challenge', formId: 'abc', token },
      origin: ORIGIN,
      source: frame.contentWindow,
    }),
  );

async function pick(withChallenge: boolean, onError = vi.fn()) {
  render(FormhausForm, { props: { id: 'abc', initialForm: { definition, version: 1, ...(withChallenge && { challenge }) }, onError } });
  const input = (await screen.findByLabelText('CV')) as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' })] });
  await fireEvent.change(input);
  if (!withChallenge) return {};
  await fireEvent.focusIn(input);
  const frame = await screen.findByTitle<HTMLIFrameElement>('Bot check');
  const post = vi.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(() => undefined);
  frame.dispatchEvent(new Event('load'));
  return { frame, post };
}

const send = () => fireEvent.click(screen.getByRole('button', { name: 'Send' }));

afterEach(() => vi.unstubAllGlobals());

it('asks for the bot check token after the upload finishes', async () => {
  const server = api([done()], true);
  const { frame, post } = await pick(true);
  await send();
  await waitFor(() => expect(server.fetchMock).toHaveBeenCalledTimes(2));
  await new Promise((resolve) => setTimeout(resolve));
  expect(post).not.toHaveBeenCalled();
  server.release();
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  answer(frame!, 'ts_1');
  expect(await screen.findByRole('status')).toBeDefined();
  expect(server.submits()[0].body).toMatchObject({ values: { cv: 'up-1' }, _fh_ts: 'ts_1' });
});

it('uploads the file again and resubmits once when the server says it is gone', async () => {
  const server = api([gone(), done()]);
  const onError = vi.fn();
  const { frame, post } = await pick(true, onError);
  await send();
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  answer(frame!, 'ts_1');
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  expect(screen.queryByText('Upload the file again.')).toBeNull();
  answer(frame!, 'ts_2');
  expect(await screen.findByRole('status')).toBeDefined();
  expect(post.mock.calls.map(([message]) => (message as { fresh: boolean }).fresh)).toEqual([true, true]);
  const [first, second] = server.submits();
  expect(first.body).toMatchObject({ values: { cv: 'up-1' }, _fh_ts: 'ts_1' });
  expect(second.body).toMatchObject({ values: { cv: 'up-2' }, _fh_ts: 'ts_2' });
  expect(second.key).not.toBe(first.key);
  expect(onError).not.toHaveBeenCalled();
});

it('shows the error when the file is gone again after the retry', async () => {
  const server = api([gone(), gone(), done()]);
  const onError = vi.fn();
  await pick(false, onError);
  await send();
  expect(await screen.findByText('Upload the file again.')).toBeDefined();
  expect(server.submits()).toHaveLength(2);
  expect(server.tickets()).toBe(2);
  expect(onError).toHaveBeenCalledTimes(1);
});

it('does not retry other field errors', async () => {
  const server = api([reply(422, { error: 'invalid', errors: { cv: 'This file is not a real PDF file.' } }), done()]);
  await pick(false);
  await send();
  expect(await screen.findByText('This file is not a real PDF file.')).toBeDefined();
  await new Promise((resolve) => setTimeout(resolve));
  expect(server.submits()).toHaveLength(1);
  expect(server.tickets()).toBe(1);
});

it('does not retry network errors', async () => {
  const onError = vi.fn();
  const server = api([new TypeError('Failed to fetch'), done()]);
  await pick(false, onError);
  await send();
  await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve));
  expect(server.submits()).toHaveLength(1);
  expect(server.tickets()).toBe(1);
});
