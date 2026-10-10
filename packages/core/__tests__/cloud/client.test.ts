import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudError, createCloudController, createSubmitter, fetchDefinition, type CloudState } from '../../src/cloud';
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

afterEach(() => vi.unstubAllGlobals());

describe('cloud client', () => {
  it('fetches the definition from the api base', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, definition));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchDefinition({ id: 'abc', apiBase: 'https://example.test/' })).resolves.toEqual(definition);
    expect(fetchMock.mock.calls[0][0]).toBe('https://example.test/f/abc/definition');
  });

  it('throws a CloudError with the response code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(410, { error: 'form_closed' })));
    await expect(fetchDefinition({ id: 'abc' })).rejects.toMatchObject({ status: 410, code: 'form_closed' });
  });

  it('reuses the idempotency key for the same body and rotates it for a new one', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply(429, { error: 'rate_limited' }))
      .mockResolvedValueOnce(reply(201, { id: 's1', values: {} }))
      .mockResolvedValue(reply(201, { id: 's2', values: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const submit = createSubmitter({ id: 'abc' });
    await expect(submit({ name: 'Ada' })).rejects.toBeInstanceOf(CloudError);
    await submit({ name: 'Ada' });
    await submit({ name: 'Ada' });
    const keys = fetchMock.mock.calls.map(([, init]) => init.headers['Idempotency-Key']);
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).not.toBe(keys[1]);
  });

  it('exposes field errors from a 422', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(422, { errors: { name: 'Required' } })));
    await expect(createSubmitter({ id: 'abc' })({})).rejects.toMatchObject({ status: 422, errors: { name: 'Required' } });
  });

  it('sends skipped steps and falls back when randomUUID is missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(201, { id: 's1', values: {} }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('crypto', { getRandomValues: (array: Uint8Array) => array.fill(7) });
    await createSubmitter({ id: 'abc' })({ name: 'Ada' }, ['two']);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ values: { name: 'Ada' }, skippedSteps: ['two'] });
    expect(init.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('cloud controller', () => {
  function setup() {
    const states: CloudState[] = [];
    const onSuccess = vi.fn();
    const controller = createCloudController({ id: 'abc' }, { onChange: (state) => states.push(state), onSuccess });
    return { states, onSuccess, controller };
  }

  it('loads the definition and ignores results after dispose', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, definition)));
    const loaded = setup();
    loaded.controller.start();
    await vi.waitFor(() => expect(loaded.states.at(-1)?.definition).toEqual(definition));
    const disposed = setup();
    disposed.controller.start();
    disposed.controller.dispose();
    await Promise.resolve();
    expect(disposed.states).toEqual([]);
  });

  it('does not report success after dispose', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(201, { id: 's1', values: {} })));
    const { states, onSuccess, controller } = setup();
    const pending = controller.submit({ name: 'Ada' });
    controller.dispose();
    await pending;
    expect(onSuccess).not.toHaveBeenCalled();
    expect(states).toEqual([]);
  });

  it('keeps field errors from a 422 and rethrows', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(422, { errors: { name: 'Required' } })));
    const { states, controller } = setup();
    await expect(controller.submit({})).rejects.toBeInstanceOf(CloudError);
    expect(states.at(-1)?.errors).toEqual({ name: 'Required' });
  });
});
