import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import FormhausForm from '../src/cloud/FormhausForm.vue';

const definition: FormDefinition = { id: 'contact', title: 'Contact', submit: { label: 'Send' },
  fields: [{ key: 'email', type: 'text', label: 'Email', validation: { required: true } }] };

const wizard: FormDefinition = { id: 'wizard', title: 'Wizard', submit: { label: 'Send' }, steps: [
  { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
  { id: 'two', title: 'Two', skip: { label: 'Skip' }, fields: [{ key: 'bio', type: 'text', label: 'Bio' }] },
] };

function reply(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

function stubApi(...submitReplies: ReturnType<typeof reply>[]) {
  return stubDefinition(definition, ...submitReplies);
}

function stubDefinition(loaded: FormDefinition, ...submitReplies: ReturnType<typeof reply>[]) {
  const submits = [...submitReplies];
  const fetchMock = vi.fn(async (url: string, init?: { method?: string }) => (
    init?.method === 'POST' ? submits.shift()! : reply(200, loaded)
  ));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function posts(fetchMock: ReturnType<typeof stubApi>) {
  return fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST') as unknown as [string, { headers: Record<string, string>; body: string }][];
}

async function fillAndSend(value: string) {
  await fireEvent.update(await screen.findByRole('textbox'), value);
  await fireEvent.click(screen.getByText('Send'));
}

afterEach(() => vi.unstubAllGlobals());

it('renders the fetched definition', async () => {
  const fetchMock = stubApi();
  render(FormhausForm, { props: { id: 'abc', apiBase: 'https://example.test' } });
  expect(await screen.findByText('Email')).toBeDefined();
  expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/f/abc/definition');
});

it('shows an error when the definition cannot be loaded', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => reply(410, { error: 'form_closed' })));
  const onError = vi.fn();
  render(FormhausForm, { props: { id: 'abc', onError } });
  expect((await screen.findByRole('alert')).textContent).toBe('This form no longer accepts submissions.');
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ status: 410, code: 'form_closed' }));
});

it('posts values and emits success', async () => {
  const fetchMock = stubApi(reply(201, { id: 's1', values: { email: 'a@b.co' } }));
  const { emitted } = render(FormhausForm, { props: { id: 'abc' } });
  await fillAndSend('a@b.co');
  await waitFor(() => expect(emitted().success).toEqual([[{ id: 's1', values: { email: 'a@b.co' } }]]));
  expect(JSON.parse(posts(fetchMock)[0][1].body)).toEqual({ values: { email: 'a@b.co' }, skippedSteps: [] });
  expect(screen.getByRole('status')).toBeDefined();
});

it('maps 422 errors onto fields', async () => {
  stubApi(reply(422, { errors: { email: 'Already registered' } }));
  const { emitted } = render(FormhausForm, { props: { id: 'abc' } });
  await fillAndSend('a@b.co');
  expect(await screen.findByText('Already registered')).toBeDefined();
  expect(emitted().success).toBeUndefined();
});

it('reuses the idempotency key when retrying the same body', async () => {
  const fetchMock = stubApi(reply(429, { error: 'rate_limited' }), reply(201, { id: 's1', values: {} }));
  render(FormhausForm, { props: { id: 'abc' } });
  await fillAndSend('a@b.co');
  expect(await screen.findByText('Too many submissions. Try again shortly.')).toBeDefined();
  await fireEvent.click(screen.getByText('Send'));
  await waitFor(() => expect(posts(fetchMock)).toHaveLength(2));
  const [first, second] = posts(fetchMock).map(([, init]) => init.headers['Idempotency-Key']);
  expect(first).toBeTruthy();
  expect(second).toBe(first);
});

it('sends the steps the engine skipped', async () => {
  const fetchMock = stubDefinition(wizard, reply(201, { id: 's1', values: {} }));
  render(FormhausForm, { props: { id: 'abc' } });
  await fireEvent.click(await screen.findByText('Continue'));
  await fireEvent.click(await screen.findByText('Skip'));
  await waitFor(() => expect(posts(fetchMock)).toHaveLength(1));
  expect(JSON.parse(posts(fetchMock)[0][1].body).skippedSteps).toEqual(['two']);
});

it('does not report an optional empty step that was visited as skipped', async () => {
  const fetchMock = stubDefinition(wizard, reply(201, { id: 's1', values: {} }));
  render(FormhausForm, { props: { id: 'abc' } });
  await fireEvent.click(await screen.findByText('Continue'));
  await fireEvent.click(await screen.findByText('Send'));
  await waitFor(() => expect(posts(fetchMock)).toHaveLength(1));
  expect(JSON.parse(posts(fetchMock)[0][1].body).skippedSteps).toEqual([]);
});

it('loads the new definition when the id changes and ignores the old response', async () => {
  let resolveFirst: (value: ReturnType<typeof reply>) => void = () => {};
  const fetchMock = vi.fn(async (url: string) => (
    url.includes('/f/one/') ? new Promise<ReturnType<typeof reply>>((resolve) => { resolveFirst = resolve; })
      : reply(200, { ...definition, fields: [{ key: 'other', type: 'text', label: 'Other' }] })
  ));
  vi.stubGlobal('fetch', fetchMock);
  const { rerender } = render(FormhausForm, { props: { id: 'one' } });
  await rerender({ id: 'two' });
  expect(await screen.findByText('Other')).toBeDefined();
  resolveFirst(reply(200, definition));
  await Promise.resolve();
  expect(screen.queryByText('Email')).toBeNull();
});

it('aborts the request on unmount', async () => {
  const signals: { aborted: boolean }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: { signal: { aborted: boolean } }) => {
    signals.push(init!.signal);
    return new Promise(() => {});
  }));
  const { unmount } = render(FormhausForm, { props: { id: 'abc' } });
  await waitFor(() => expect(signals).toHaveLength(1));
  unmount();
  expect(signals[0].aborted).toBe(true);
});
