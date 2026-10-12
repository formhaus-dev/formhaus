import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudError, createSubmitter, fetchDefinition } from '../../src/cloud';
import { createCloudController, type CloudState } from '../../src/internal';
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
  return { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } };
}

function stalled() {
  return vi.fn((_url: string, init: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }));
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('cloud failures', () => {
  it('reports a paused form from the definition endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(409, { error: 'Form paused' })));

    await expect(fetchDefinition({ id: 'abc' })).rejects.toMatchObject({
      status: 409, code: 'paused', message: 'This form is paused.', action: null,
    });
  });

  it.each([
    ['loading', () => fetchDefinition({ id: 'abc' }), 15_000],
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
    const fetchMock = vi.fn().mockResolvedValueOnce(notJson()).mockResolvedValueOnce(notJson())
      .mockResolvedValue(reply(201, { id: 's1', values: {} }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchDefinition({ id: 'abc' })).rejects.toMatchObject({ code: 'invalid_response', message: 'Something went wrong. Try again.' });
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
