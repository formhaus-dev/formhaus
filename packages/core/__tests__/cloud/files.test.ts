import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCloudController, type CloudState } from '../../src/internal';
import type { FormDefinition } from '../../src';

const definition = {
  id: 'apply',
  title: 'Apply',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'docs', type: 'section', title: 'Docs', fields: [{ key: 'cv', type: 'file', label: 'CV' }] },
  ],
} as FormDefinition;

const published = { ...definition };

function reply(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

function file(name: string) {
  return { name, size: 4, type: 'application/pdf', arrayBuffer: async () => new ArrayBuffer(4) };
}

afterEach(() => vi.unstubAllGlobals());

async function loaded(fetchMock: ReturnType<typeof vi.fn>) {
  vi.stubGlobal('fetch', fetchMock);
  const states: CloudState[] = [];
  const controller = createCloudController({ id: 'abc', apiBase: 'https://api.test' }, { onChange: (state) => states.push(state) });
  controller.start();
  await vi.waitFor(() => expect(states.at(-1)?.definition).toBeTruthy());
  return { states, controller };
}

describe('cloud file uploads', () => {
  it('uploads each file once and submits its id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, published))
      .mockResolvedValueOnce(
        reply(201, { id: 'up-1', url: 'https://objects.test/k', method: 'PUT', headers: { 'Content-Type': 'application/pdf' } }),
      )
      .mockResolvedValueOnce(reply(200, null))
      .mockResolvedValueOnce(reply(503, { error: 'unavailable' }))
      .mockResolvedValue(reply(201, { id: 's1', values: {} }));
    const { controller } = await loaded(fetchMock);
    const cv = file('cv.pdf');
    await expect(controller.submit({ name: 'Ada', cv })).rejects.toMatchObject({ status: 503 });
    await controller.submit({ name: 'Ada', cv });
    const calls = fetchMock.mock.calls.map(([url, init]) => `${init?.method ?? 'GET'} ${String(url).split('?')[0]}`);
    expect(calls).toEqual([
      'GET https://api.test/f/abc/form',
      'POST https://api.test/f/abc/uploads',
      'PUT https://objects.test/k',
      'POST https://api.test/f/abc',
      'POST https://api.test/f/abc',
    ]);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ field: 'cv', name: 'cv.pdf', size: 4 });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ body: cv, headers: { 'Content-Type': 'application/pdf' } });
    const keys = [3, 4].map((i) => fetchMock.mock.calls[i][1].headers['Idempotency-Key']);
    expect(keys[0]).toBe(keys[1]);
    expect(JSON.parse(fetchMock.mock.calls[4][1].body).values).toEqual({ name: 'Ada', cv: 'up-1' });
  });

  it('keeps the same payload on retry when one file is set in two fields', async () => {
    const two = {
      ...definition,
      fields: [
        { key: 'cv', type: 'file', label: 'CV' },
        { key: 'cover', type: 'file', label: 'Cover' },
      ],
    } as FormDefinition;
    const submits = [reply(503, { error: 'unavailable' }), reply(201, { id: 's1', values: {} })];
    const fetchMock = vi.fn(async (url: string, init?: { method?: string; body?: unknown }) => {
      if (!init?.method) return reply(200, two);
      if (url.includes('/uploads')) {
        const { field } = JSON.parse(init.body as string);
        return reply(201, { id: `up-${field}`, url: `https://objects.test/${field}`, method: 'PUT', headers: {} });
      }
      return init.method === 'PUT' ? reply(200, null) : submits.shift()!;
    });
    const { controller } = await loaded(fetchMock);
    const shared = file('cv.pdf');
    await expect(controller.submit({ cv: shared, cover: shared })).rejects.toMatchObject({ status: 503 });
    await controller.submit({ cv: shared, cover: shared });
    const sent = fetchMock.mock.calls.filter(([url, init]) => init?.method === 'POST' && !String(url).includes('/uploads'));
    expect(sent.map(([, init]) => JSON.parse(init!.body as string).values)).toEqual([
      { cv: 'up-cv', cover: 'up-cover' },
      { cv: 'up-cv', cover: 'up-cover' },
    ]);
    const keys = sent.map(([, init]) => (init as unknown as { headers: Record<string, string> }).headers['Idempotency-Key']);
    expect(keys[0]).toBe(keys[1]);
  });

  it('shows a refused upload on its field and does not submit', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, published))
      .mockResolvedValueOnce(reply(422, { error: 'file_rejected', code: 'file_too_large', message: 'Files can be up to 10 MB.' }));
    const { states, controller } = await loaded(fetchMock);
    await expect(controller.submit({ cv: file('big.pdf') })).rejects.toMatchObject({ status: 422 });
    expect(states.at(-1)?.errors).toEqual({ cv: 'Files can be up to 10 MB.' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports a failed storage upload and a rate limit in plain words', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, published))
      .mockResolvedValueOnce(reply(201, { id: 'up-2', url: 'https://objects.test/k', method: 'PUT', headers: {} }))
      .mockResolvedValueOnce(reply(403, null))
      .mockResolvedValueOnce(
        reply(429, { error: 'rate_limited', message: 'Retry after the number of seconds in the Retry-After header.' }),
      );
    const { states, controller } = await loaded(fetchMock);
    await expect(controller.submit({ cv: file('a.pdf') })).rejects.toMatchObject({ status: 422 });
    expect(states.at(-1)?.errors).toEqual({ cv: 'The upload failed. Try again.' });
    await expect(controller.submit({ cv: file('b.pdf') })).rejects.toMatchObject({ status: 422 });
    expect(states.at(-1)?.errors).toEqual({ cv: 'Too many uploads right now. Try again in a few minutes.' });
  });

  it('uploads again when the server no longer has the file', async () => {
    const ticket = (id: string) => reply(201, { id, url: `https://objects.test/${id}`, method: 'PUT', headers: {} });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, published))
      .mockResolvedValueOnce(ticket('up-1'))
      .mockResolvedValueOnce(reply(200, null))
      .mockResolvedValueOnce(reply(422, { error: 'invalid', errors: { cv: 'Upload the file again.' } }))
      .mockResolvedValueOnce(ticket('up-2'))
      .mockResolvedValueOnce(reply(200, null))
      .mockResolvedValue(reply(201, { id: 's1', values: {} }));
    const { controller } = await loaded(fetchMock);
    const cv = file('cv.pdf');
    await expect(controller.submit({ cv })).rejects.toMatchObject({ status: 422 });
    await controller.submit({ cv });
    expect(JSON.parse(fetchMock.mock.calls.at(-1)?.[1].body).values).toEqual({ cv: 'up-2' });
  });

  it('stops before submitting when disposed during an upload', async () => {
    let finishPut: (value: unknown) => void = () => {};
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, published))
      .mockResolvedValueOnce(reply(201, { id: 'up-1', url: 'https://objects.test/k', method: 'PUT', headers: {} }))
      .mockImplementationOnce(() => new Promise((resolve) => (finishPut = resolve)))
      .mockResolvedValue(reply(201, { id: 's1', values: {} }));
    const { controller } = await loaded(fetchMock);
    const pending = controller.submit({ cv: file('cv.pdf') }).catch(() => undefined);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    controller.dispose();
    finishPut(reply(200, null));
    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('leaves forms without file fields untouched', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(200, { ...published, fields: [{ key: 'name', type: 'text', label: 'Name' }] }))
      .mockResolvedValue(reply(201, { id: 's1', values: {} }));
    const { controller } = await loaded(fetchMock);
    await controller.submit({ name: 'Ada' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
