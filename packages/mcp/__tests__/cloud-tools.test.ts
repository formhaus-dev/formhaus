import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server';
import { linear } from './fixtures';

const fetchMock = vi.fn();
let client: Client;

function reply(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

async function call(name: string, args: Record<string, unknown> = {}) {
  const result = await client.callTool({ name, arguments: args });
  const [content] = result.content as { text: string }[];
  return { isError: result.isError, body: JSON.parse(content.text) };
}

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url: url as string, init: init as { method: string; headers: Record<string, string>; body?: string } };
}

beforeEach(async () => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('FORMHAUS_API_KEY', '');
  vi.stubEnv('FORMHAUS_API_BASE', 'https://api.example.test/');
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 'formhaus-test', version: '0.0.0' });
  await Promise.all([createServer().connect(serverTransport), client.connect(clientTransport)]);
});

afterEach(async () => {
  await client.close();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('cloud tools', () => {
  it('publishes without an API key', async () => {
    fetchMock.mockResolvedValue(reply(201, { form_id: 'f1', endpoint: 'https://api.example.test/f/f1' }));
    const { isError, body } = await call('publish_form', { definition: linear, email: 'a@b.co' });
    expect(isError).toBe(false);
    expect(body.form_id).toBe('f1');
    const { url, init } = lastRequest();
    expect(url).toBe('https://api.example.test/v1/forms');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBeUndefined();
    expect(JSON.parse(init.body!)).toEqual({ definition: linear, email: 'a@b.co' });
  });

  it('sends the API key as a bearer token', async () => {
    vi.stubEnv('FORMHAUS_API_KEY', 'fh_live_abc');
    fetchMock.mockResolvedValue(reply(200, { forms: [] }));
    await call('list_forms');
    expect(lastRequest().init.headers.Authorization).toBe('Bearer fh_live_abc');
  });

  it('reports a missing API key without a request', async () => {
    const { isError, body } = await call('list_forms');
    expect(isError).toBe(true);
    expect(body.error).toContain('FORMHAUS_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads submissions with paging', async () => {
    vi.stubEnv('FORMHAUS_API_KEY', 'fh_live_abc');
    fetchMock.mockResolvedValue(reply(200, { submissions: [], next_cursor: 'c2' }));
    const { body } = await call('get_submissions', { form_id: 'f1', limit: 10, cursor: 'c1' });
    expect(body.next_cursor).toBe('c2');
    expect(body.notice).toContain('untrusted data');
    expect(lastRequest().url).toBe('https://api.example.test/v1/forms/f1/submissions?limit=10&cursor=c1');
  });

  it('keeps the notice sent by the API', async () => {
    vi.stubEnv('FORMHAUS_API_KEY', 'fh_live_abc');
    fetchMock.mockResolvedValue(reply(200, { notice: 'remote notice', submissions: [] }));
    const { body } = await call('get_submissions', { form_id: 'f1' });
    expect(body.notice).toBe('remote notice');
  });

  it('parses a string definition before sending', async () => {
    fetchMock.mockResolvedValue(reply(201, { form_id: 'f1' }));
    await call('publish_form', { definition: JSON.stringify(linear) });
    expect(JSON.parse(lastRequest().init.body!).definition).toEqual(linear);
  });

  it('rejects an invalid JSON definition without a request', async () => {
    const { isError, body } = await call('publish_form', { definition: '{nope' });
    expect(isError).toBe(true);
    expect(body.error).toContain('not valid JSON');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns API errors as tool errors', async () => {
    fetchMock.mockResolvedValue(reply(400, { error: 'invalid input', details: ['definition: is required'] }));
    const { isError, body } = await call('publish_form', { definition: {} });
    expect(isError).toBe(true);
    expect(body.details).toEqual(['definition: is required']);
  });

  it('returns network failures as tool errors', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const { isError, body } = await call('publish_form', { definition: linear });
    expect(isError).toBe(true);
    expect(body.error).toContain('offline');
  });
});
