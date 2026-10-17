import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import { FormActions } from '../src';
import { FormhausForm } from '../src/cloud';

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

function challengeFrame() {
  const frame = document.querySelector<HTMLIFrameElement>('iframe[title="Bot check"]')!;
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

afterEach(() => vi.unstubAllGlobals());

it('loads the bot check on first focus, above the actions, hidden', async () => {
  stub(reply(200, envelope));
  render(<FormhausForm id="abc" />);
  const name = await screen.findByLabelText('Name');
  expect(document.querySelector('iframe')).toBeNull();
  fireEvent.focus(name);
  const { frame } = challengeFrame();
  expect(frame.src).toBe(envelope.challenge.url);
  expect(frame.getAttribute('aria-hidden')).toBe('true');
  expect(frame.tabIndex).toBe(-1);
  expect(frame.parentElement?.nextElementSibling?.className).toContain('fh-form-actions');
});

it('submits with a token from the challenge frame and ignores spoofed messages', async () => {
  const fetchMock = stub(reply(200, envelope), reply(201, { id: 's1', values: {} }));
  render(<FormhausForm id="abc" />);
  const name = await screen.findByLabelText('Name');
  fireEvent.focus(name);
  const { frame, post } = challengeFrame();
  fireEvent.change(name, { target: { value: 'Ada' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
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
  render(<FormhausForm id="abc" />);
  fireEvent.focus(await screen.findByLabelText('Name'));
  const { frame } = challengeFrame();
  answer(frame, { height: 65 });
  expect(frame.getAttribute('aria-hidden')).toBe('false');
  expect(frame.tabIndex).toBe(0);
  expect(frame.style.height).toBe('65px');
});

it('shows a failed check as a notice and runs the check again on retry', async () => {
  const fetchMock = stub(reply(200, envelope), reply(403, { error: 'verification_failed' }), reply(201, { id: 's1', values: {} }));
  render(<FormhausForm id="abc" />);
  const name = await screen.findByLabelText('Name');
  fireEvent.focus(name);
  const { frame, post } = challengeFrame();
  frame.dispatchEvent(new Event('load'));
  fireEvent.change(name, { target: { value: 'Ada' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
  answer(frame, { token: 'ts_1' });
  expect(await screen.findByText('The bot check did not pass. Submit again to retry.')).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
  answer(frame, { token: 'ts_2' });
  expect(await screen.findByRole('status')).toBeDefined();
  expect(sent(fetchMock, 1)._fh_ts).toBe('ts_1');
  expect(sent(fetchMock, 2)._fh_ts).toBe('ts_2');
});

it('renders no frame for a form without a bot check', async () => {
  const fetchMock = stub(reply(200, { ...envelope, challenge: undefined }), reply(201, { id: 's1', values: {} }));
  render(<FormhausForm id="abc" />);
  const name = await screen.findByLabelText('Name');
  fireEvent.focus(name);
  fireEvent.change(name, { target: { value: 'Ada' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send' }));
  expect(await screen.findByRole('status')).toBeDefined();
  expect(document.querySelector('iframe')).toBeNull();
  expect(sent(fetchMock, 1)).not.toHaveProperty('_fh_ts');
});

it('keeps the frame when the parent re-renders with an inline actions component', async () => {
  stub(reply(200, envelope));
  const view = render(<FormhausForm id="abc" actionsComponent={(props) => <FormActions {...props} />} />);
  fireEvent.focus(await screen.findByLabelText('Name'));
  const { frame } = challengeFrame();
  view.rerender(<FormhausForm id="abc" actionsComponent={(props) => <FormActions {...props} />} />);
  expect(frame.isConnected).toBe(true);
  expect(document.querySelectorAll('iframe')).toHaveLength(1);
});
