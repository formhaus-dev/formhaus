import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FormDefinition } from '../../src';
import { createCloudController, type CloudState } from '../../src/internal';
import { challenge, flush, page } from './fake-challenge';

afterEach(() => vi.unstubAllGlobals());

describe('cloud controller with a bot check', () => {
  const definition: FormDefinition = {
    id: 'c',
    title: 'C',
    submit: { label: 'Send' },
    fields: [{ key: 'name', type: 'text', label: 'Name' }],
  };
  const respond = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });
  const sentBody = (fetchMock: ReturnType<typeof vi.fn>, call: number) => JSON.parse(fetchMock.mock.calls[call][1].body);

  async function answer(fake: ReturnType<typeof page>, fields: Record<string, unknown>) {
    await flush();
    fake.last().onload?.();
    await flush();
    fake.reply(fields);
  }

  function create(fake: ReturnType<typeof page>, states: CloudState[] = []) {
    const controller = createCloudController(
      { id: 'abc', initialForm: { definition, challenge }, challengeHost: () => fake.host },
      { onChange: (state) => states.push(state) },
    );
    controller.start();
    return controller;
  }

  const key = (fetchMock: ReturnType<typeof vi.fn>, call: number) => fetchMock.mock.calls[call][1].headers['Idempotency-Key'];

  it('reuses the token and the Idempotency-Key when a network error is retried', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(respond(201, { id: 's1', values: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const fake = page();
    const states: CloudState[] = [];
    const controller = create(fake, states);
    expect(states.at(-1)?.challenge).toEqual(challenge);
    controller.warm();
    expect(fake.frames).toHaveLength(1);

    const first = controller.submit({ name: 'Ada' }, []);
    await answer(fake, { token: 'ts_1' });
    await first.catch(() => undefined);
    const second = controller.submit({ name: 'Ada' }, []);
    await answer(fake, { token: 'ts_1' });
    await second;
    expect(fake.requests().map((request) => request.fresh)).toEqual([true, false]);
    expect(sentBody(fetchMock, 1)._fh_ts).toBe('ts_1');
    expect(key(fetchMock, 1)).toBe(key(fetchMock, 0));
    expect(states.at(-1)?.done).toBe(true);
    controller.dispose();
    expect(fake.listeners.size).toBe(0);
  });

  it('asks for a fresh token after the server refuses the check', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond(403, { error: 'verification_failed' }))
      .mockResolvedValueOnce(respond(201, { id: 's1', values: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const fake = page();
    const states: CloudState[] = [];
    const controller = create(fake, states);
    const first = controller.submit({ name: 'Ada' }, []);
    await answer(fake, { token: 'ts_1' });
    await first.catch(() => undefined);
    expect(states.at(-1)?.notice).toMatchObject({ message: 'The bot check did not pass. Submit again to retry.', action: null });
    const second = controller.submit({ name: 'Ada' }, []);
    await answer(fake, { token: 'ts_2' });
    await second;
    expect(fake.requests().map((request) => request.fresh)).toEqual([true, true]);
    expect(sentBody(fetchMock, 1)._fh_ts).toBe('ts_2');
    expect(key(fetchMock, 1)).toBe(key(fetchMock, 0));
  });

  it('does not post when the check fails in the browser', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fake = page();
    const states: CloudState[] = [];
    const controller = create(fake, states);
    const attempt = controller.submit({ name: 'Ada' }, []);
    await answer(fake, { error: 'bot check failed: 600010' });
    await attempt.catch(() => undefined);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(states.at(-1)?.notice).toMatchObject({ action: null });
  });

  it('submits without a token when the frame never answers', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(respond(201, { id: 's1', values: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const fake = page();
    const controller = create(fake);
    const attempt = controller.submit({ name: 'Ada' }, []);
    await vi.advanceTimersByTimeAsync(10_000);
    await attempt;
    vi.useRealTimers();
    expect(sentBody(fetchMock, 0)).not.toHaveProperty('_fh_ts');
  });

  it('submits without a token when the form has no bot check or no host', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respond(201, { id: 's1', values: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const fake = page();
    const plain = createCloudController(
      { id: 'abc', initialForm: { definition }, challengeHost: () => fake.host },
      { onChange: () => undefined },
    );
    plain.start();
    plain.warm();
    await plain.submit({ name: 'Ada' }, []);
    const hostless = createCloudController({ id: 'abc', initialForm: { definition, challenge } }, { onChange: () => undefined });
    hostless.start();
    await hostless.submit({ name: 'Ada' }, []);
    expect(fake.frames).toHaveLength(0);
    expect(sentBody(fetchMock, 0)).not.toHaveProperty('_fh_ts');
    expect(sentBody(fetchMock, 1)).not.toHaveProperty('_fh_ts');
  });
});
