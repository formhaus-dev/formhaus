import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import FormhausForm from '../src/cloud/FormhausForm.vue';

const ORIGIN = 'https://formhaus.cc';
const definition: FormDefinition = {
  id: 'feedback',
  title: 'Feedback',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name' }],
};
const envelope = {
  definition,
  version: 1,
  settings: {},
  challenge: { provider: 'turnstile', siteKey: '0x4AAA', url: `${ORIGIN}/challenge?form=abc` },
};

function reply(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body, headers: { get: () => null } };
}

function stub(...replies: Array<ReturnType<typeof reply>>) {
  const queue = [...replies];
  const fetchMock = vi.fn(async () => queue.shift()!);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function challengeFrame() {
  const frame = await screen.findByTitle<HTMLIFrameElement>('Bot check');
  const post = vi.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(() => undefined);
  return { frame, post };
}

function send(frame: HTMLIFrameElement, data: unknown, origin = ORIGIN, source: Window | null = frame.contentWindow) {
  window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
}

const answer = (frame: HTMLIFrameElement, fields: Record<string, unknown>) =>
  send(frame, { type: 'formhaus:challenge', formId: 'abc', ...fields });

const sent = (fetchMock: ReturnType<typeof stub>, call: number) =>
  JSON.parse(String((fetchMock.mock.calls[call] as unknown as [string, { body: string }])[1].body));

async function focusIn(element: HTMLElement) {
  await new Promise((resolve) => setTimeout(resolve, 2));
  await fireEvent.focusIn(element);
}

afterEach(() => vi.unstubAllGlobals());

it('loads the bot check on first focus, above the actions, hidden', async () => {
  stub(reply(200, envelope));
  render(FormhausForm, { props: { id: 'abc' } });
  const name = await screen.findByLabelText('Name');
  expect(document.querySelector('iframe')).toBeNull();
  await focusIn(name);
  const { frame } = await challengeFrame();
  expect(frame.src).toBe(envelope.challenge.url);
  expect(frame.getAttribute('aria-hidden')).toBe('true');
  expect(frame.tabIndex).toBe(-1);
  expect(frame.parentElement?.nextElementSibling?.className).toContain('fh-form-actions');
});

it('submits with a token from the challenge frame and ignores spoofed messages', async () => {
  const fetchMock = stub(reply(200, envelope), reply(201, { id: 's1', values: {} }));
  render(FormhausForm, { props: { id: 'abc' } });
  const name = await screen.findByLabelText('Name');
  await focusIn(name);
  const { frame, post } = await challengeFrame();
  await fireEvent.update(name, 'Ada');
  await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  frame.dispatchEvent(new Event('load'));
  await waitFor(() => expect(post).toHaveBeenCalledWith({ type: 'formhaus:challenge-request', formId: 'abc', id: 1, fresh: true }, ORIGIN));
  send(frame, { type: 'formhaus:challenge', formId: 'abc', token: 'evil' }, 'https://evil.example');
  send(frame, { type: 'formhaus:challenge', formId: 'abc', token: 'evil' }, ORIGIN, window);
  answer(frame, { formId: 'other', token: 'evil' });
  answer(frame, { token: 'ts_1' });
  expect(await screen.findByRole('status')).toBeDefined();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(sent(fetchMock, 1)._fh_ts).toBe('ts_1');
});

it('shows the frame when Turnstile needs interaction', async () => {
  stub(reply(200, envelope));
  render(FormhausForm, { props: { id: 'abc' } });
  await focusIn(await screen.findByLabelText('Name'));
  const { frame } = await challengeFrame();
  answer(frame, { height: 65 });
  expect(frame.getAttribute('aria-hidden')).toBe('false');
  expect(frame.tabIndex).toBe(0);
  expect(frame.style.height).toBe('65px');
});

it('shows a failed check as a notice and runs the check again on retry', async () => {
  const fetchMock = stub(reply(200, envelope), reply(403, { error: 'verification_failed' }), reply(201, { id: 's1', values: {} }));
  render(FormhausForm, { props: { id: 'abc' } });
  const name = await screen.findByLabelText('Name');
  await focusIn(name);
  const { frame, post } = await challengeFrame();
  frame.dispatchEvent(new Event('load'));
  await fireEvent.update(name, 'Ada');
  await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  answer(frame, { token: 'ts_1' });
  expect(await screen.findByText('The bot check did not pass. Submit again to retry.')).toBeDefined();
  await new Promise((resolve) => setTimeout(resolve));
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  answer(frame, { token: 'ts_2' });
  expect(await screen.findByRole('status')).toBeDefined();
  expect(sent(fetchMock, 1)._fh_ts).toBe('ts_1');
  expect(sent(fetchMock, 2)._fh_ts).toBe('ts_2');
});

it('renders no frame for a form without a bot check', async () => {
  const fetchMock = stub(reply(200, { ...envelope, challenge: undefined }), reply(201, { id: 's1', values: {} }));
  render(FormhausForm, { props: { id: 'abc' } });
  const name = await screen.findByLabelText('Name');
  await focusIn(name);
  await fireEvent.update(name, 'Ada');
  await fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  expect(await screen.findByRole('status')).toBeDefined();
  expect(document.querySelector('iframe')).toBeNull();
  expect(sent(fetchMock, 1)).not.toHaveProperty('_fh_ts');
});
