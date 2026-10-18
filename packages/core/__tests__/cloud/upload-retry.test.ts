import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FormDefinition } from '../../src';
import { createCloudController, type CloudState } from '../../src/internal';
import { challenge, flush, page } from './fake-challenge';

const definition: FormDefinition = {
  id: 'apply',
  title: 'Apply',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'cv', type: 'file', label: 'CV' },
  ],
};

const respond = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });
const gone = () => respond(422, { error: 'invalid', errors: { cv: 'Upload the file again.' } });
const done = () => respond(201, { id: 's1', values: {} });
const file = () => ({ name: 'cv.pdf', size: 4, type: 'application/pdf', arrayBuffer: async () => new ArrayBuffer(4) });

afterEach(() => vi.unstubAllGlobals());

function api(answers: unknown[], held = false) {
  let tickets = 0;
  let release = () => {};
  const fetchMock = vi.fn(async (url: string, init?: { method?: string; body?: unknown }) => {
    if (url.includes('/uploads')) {
      tickets += 1;
      return respond(201, { id: `up-${tickets}`, url: 'https://objects.test/k', method: 'PUT', headers: {} });
    }
    if (init?.method === 'PUT') {
      if (held) await new Promise<void>((resolve) => (release = resolve));
      return respond(200, null);
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

function create(withChallenge = true) {
  const fake = page();
  const states: CloudState[] = [];
  const onError = vi.fn();
  const controller = createCloudController(
    { id: 'abc', initialForm: { definition, ...(withChallenge && { challenge }) }, challengeHost: () => fake.host },
    { onChange: (state) => states.push(state), onError },
  );
  controller.start();
  return { fake, states, onError, controller };
}

async function answer(fake: ReturnType<typeof page>, count: number, token: string) {
  await vi.waitFor(() => expect(fake.frames).toHaveLength(1));
  fake.last().onload?.();
  await vi.waitFor(() => expect(fake.requests()).toHaveLength(count));
  fake.reply({ token });
}

describe('cloud uploads with a bot check', () => {
  it('asks for the bot check token after the uploads finish', async () => {
    const server = api([done()], true);
    const { fake, controller } = create();
    controller.warm();
    const attempt = controller.submit({ name: 'Ada', cv: file() });
    await vi.waitFor(() => expect(server.fetchMock).toHaveBeenCalledTimes(2));
    fake.last().onload?.();
    await flush();
    expect(fake.requests()).toHaveLength(0);
    server.release();
    await answer(fake, 1, 'ts_1');
    await attempt;
    expect(server.submits()[0].body).toMatchObject({ values: { name: 'Ada', cv: 'up-1' }, _fh_ts: 'ts_1' });
  });

  it('uploads again and resubmits once with a fresh token when the server says the file is gone', async () => {
    const server = api([gone(), done()]);
    const { fake, states, onError, controller } = create();
    const attempt = controller.submit({ name: 'Ada', cv: file() });
    await answer(fake, 1, 'ts_1');
    await answer(fake, 2, 'ts_2');
    await attempt;
    expect(fake.requests().map((request) => request.fresh)).toEqual([true, true]);
    const [first, second] = server.submits();
    expect(first.body).toMatchObject({ values: { cv: 'up-1' }, _fh_ts: 'ts_1' });
    expect(second.body).toMatchObject({ values: { cv: 'up-2' }, _fh_ts: 'ts_2' });
    expect(second.key).not.toBe(first.key);
    expect(server.tickets()).toBe(2);
    expect(states.some((state) => state.errors.cv)).toBe(false);
    expect(onError).not.toHaveBeenCalled();
    expect(states.at(-1)?.done).toBe(true);
  });
});

describe('cloud uploads retry limits', () => {
  it('retries a gone upload only once', async () => {
    const server = api([gone(), gone(), done()]);
    const { states, onError, controller } = create(false);
    await expect(controller.submit({ cv: file() })).rejects.toMatchObject({ status: 422 });
    expect(server.submits()).toHaveLength(2);
    expect(server.tickets()).toBe(2);
    expect(states.filter((state) => state.errors.cv)).toHaveLength(1);
    expect(states.at(-1)?.errors).toEqual({ cv: 'Upload the file again.' });
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('does not retry other field errors', async () => {
    const server = api([
      respond(422, { error: 'invalid', errors: { cv: 'This file is not a real PDF file.' } }),
      respond(422, { error: 'invalid', errors: { name: 'Upload the file again.' } }),
    ]);
    const { controller } = create(false);
    await expect(controller.submit({ name: 'Ada', cv: file() })).rejects.toMatchObject({ status: 422 });
    await expect(controller.submit({ name: 'Ada', cv: file() })).rejects.toMatchObject({ status: 422 });
    expect(server.submits()).toHaveLength(2);
    expect(server.tickets()).toBe(2);
  });

  it('does not retry network errors', async () => {
    const server = api([new TypeError('Failed to fetch')]);
    const { controller } = create(false);
    await expect(controller.submit({ cv: file() })).rejects.toMatchObject({ code: 'network' });
    expect(server.submits()).toHaveLength(1);
    expect(server.tickets()).toBe(1);
  });

  it('does not retry when the upload itself is refused', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(410, { message: 'Upload the file again.' }));
    vi.stubGlobal('fetch', fetchMock);
    const { states, controller } = create(false);
    await expect(controller.submit({ cv: file() })).rejects.toMatchObject({ status: 422 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(states.at(-1)?.errors).toEqual({ cv: 'Upload the file again.' });
  });
});
