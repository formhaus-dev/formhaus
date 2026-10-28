import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudError, createSubmitter, fetchForm } from '../../src/cloud';
import { cloudLabel, createCloudController, loadMessage, localNotice, type CloudState } from '../../src/internal/cloud';
import { failureFor } from '../../src/cloud/failures';
import type { FormDefinition } from '../../src';

const definition: FormDefinition = {
  id: 'wizard',
  title: 'Wizard',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name' }],
};

function reply(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

function notJson() {
  return {
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError('Unexpected token <');
    },
  };
}

function stalled() {
  return vi.fn(
    (_url: string, init: { signal: AbortSignal }) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      }),
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('cloud failures', () => {
  it('reports a paused form from the definition endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(409, { error: 'Form paused' })));

    await expect(fetchForm({ id: 'abc' })).rejects.toMatchObject({
      status: 409,
      code: 'paused',
      message: 'This form is paused.',
      action: null,
    });
  });

  it.each([
    ['loading', () => fetchForm({ id: 'abc' }), 15_000],
    ['submitting', () => createSubmitter({ id: 'abc' })({}), 30_000],
  ])('times out while %s', async (_, request, timeout) => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', stalled());
    const result = request().catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(timeout - 1);
    await vi.advanceTimersByTimeAsync(1);

    expect(await result).toMatchObject({ status: 0, code: 'timeout', action: 'retry' });
  });

  it('wraps a response that is not JSON and keeps the idempotency key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(notJson())
      .mockResolvedValueOnce(notJson())
      .mockResolvedValue(reply(201, { id: 's1', values: {} }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchForm({ id: 'abc' })).rejects.toMatchObject({
      code: 'invalid_response',
      message: 'Something went wrong. Try again.',
    });
    const submit = createSubmitter({ id: 'abc' });
    await expect(submit({ name: 'Ada' })).rejects.toBeInstanceOf(CloudError);
    await submit({ name: 'Ada' });

    const keys = fetchMock.mock.calls.slice(1).map(([, init]) => init.headers['Idempotency-Key']);
    expect(keys[0]).toBe(keys[1]);
  });

  it('loads again after a failed load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue(reply(200, definition)));
    const states: CloudState[] = [];
    const controller = createCloudController({ id: 'abc' }, { onChange: (state) => states.push(state) });

    controller.start();
    await vi.waitFor(() => expect(states.at(-1)?.loadError).toMatchObject({ code: 'network', retryable: true }));
    controller.start();

    await vi.waitFor(() => expect(states.at(-1)?.definition).toEqual(definition));
    expect(states.at(-1)?.loadError).toBeNull();
  });
});

describe('cloud labels', () => {
  it.each([
    [409, 'unknown', 'paused'],
    [404, '', 'not_found'],
    [0, 'unknown', 'network'],
    [502, 'unknown', 'unknown'],
    [418, 'brand_new', 'unknown'],
    [403, 'verification_failed', 'verification_failed'],
  ])('codes %i %s as %s', (status, code, expected) => {
    expect(failureFor(status, code).code).toBe(expected);
  });

  const notice = { tone: 'error' as const, code: 'network' as const, message: 'English', action: 'retry' as const, details: [] };

  it('translates notices, load errors and buttons from a catalog or a function and falls back to English', () => {
    expect(localNotice(notice, { network: 'Offline' })).toEqual({ ...notice, message: 'Offline' });
    expect(localNotice(notice, () => undefined)).toEqual(notice);
    expect(localNotice(null, { network: 'Offline' })).toBeNull();
    expect(loadMessage(new CloudError({ status: 404, code: 'unknown' }), (key) => (key === 'not_found' ? 'Weg' : undefined))).toBe('Weg');
    expect(loadMessage(new Error('Broken'), { unknown: 'Fehler' })).toBe('Broken');
    expect(cloudLabel(undefined, 'reload')).toBe('Reload page');
    expect(cloudLabel({ retry: '' }, 'retry')).toBe('Try again');
    expect(cloudLabel({ submitAnother: 'Noch eine' }, 'submitAnother')).toBe('Noch eine');
  });

  it('relays errors to onError unless a failed submission already reported them', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(409, { error: 'paused' })));
    const onError = vi.fn();
    const controller = createCloudController(
      { id: 'abc', initialForm: { definition }, draftStore: false },
      { onChange: () => {}, onError },
    );
    controller.start();
    const failure = await controller.submit({ name: 'Ada' }).catch((error: unknown) => error);
    controller.relay(failure);
    expect(onError).toHaveBeenCalledTimes(1);
    const own = new Error('hook');
    controller.relay(own);
    expect(onError).toHaveBeenLastCalledWith(own);
  });
});
