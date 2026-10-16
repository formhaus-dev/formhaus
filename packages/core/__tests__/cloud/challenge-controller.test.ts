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

  it('sends a fresh token with each attempt and retries after a failed check', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(respond(403, { error: 'verification_failed' }))
      .mockResolvedValueOnce(respond(201, { id: 's1', values: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const fake = page();
    const states: CloudState[] = [];
    const controller = createCloudController(
      { id: 'abc', initialForm: { definition, challenge }, challengeHost: () => fake.host },
      { onChange: (state) => states.push(state) },
    );
    controller.start();
    expect(states.at(-1)?.challenge).toEqual(challenge);
    controller.warm();
    expect(fake.frames).toHaveLength(1);

    const first = controller.submit({ name: 'Ada' }, []);
    await answer(fake, { token: 'ts_1' });
    await first.catch(() => undefined);
    expect(sentBody(fetchMock, 0)._fh_ts).toBe('ts_1');
    expect(states.at(-1)?.notice).toMatchObject({ message: 'The bot check did not pass. Try again.', action: 'retry' });

    const second = controller.submit({ name: 'Ada' }, []);
    await answer(fake, { token: 'ts_2' });
    await second;
    expect(sentBody(fetchMock, 1)._fh_ts).toBe('ts_2');
    expect(fetchMock.mock.calls[1][1].headers['Idempotency-Key']).not.toBe(fetchMock.mock.calls[0][1].headers['Idempotency-Key']);
    expect(states.at(-1)?.done).toBe(true);
    controller.dispose();
    expect(fake.listeners.size).toBe(0);
  });

  it('does not post when the check fails in the browser', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const fake = page();
    const states: CloudState[] = [];
    const controller = createCloudController(
      { id: 'abc', initialForm: { definition, challenge }, challengeHost: () => fake.host },
      { onChange: (state) => states.push(state) },
    );
    controller.start();
    const attempt = controller.submit({ name: 'Ada' }, []);
    await answer(fake, { error: 'bot check failed: 600010' });
    await attempt.catch(() => undefined);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(states.at(-1)?.notice?.action).toBe('retry');
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
