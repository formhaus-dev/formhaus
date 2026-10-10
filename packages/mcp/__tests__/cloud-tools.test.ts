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

  it('puts the notice sent by the API before the untrusted-data notice', async () => {
    vi.stubEnv('FORMHAUS_API_KEY', 'fh_live_abc');
    fetchMock.mockResolvedValue(reply(200, { notice: 'remote notice', submissions: [] }));
    const { body } = await call('get_submissions', { form_id: 'f1' });
    expect(String(body.notice)).toMatch(/^remote notice /);
    expect(body.notice).toContain('untrusted data');
  });

  it('ignores a non-string notice sent by the API', async () => {
    vi.stubEnv('FORMHAUS_API_KEY', 'fh_live_abc');
    fetchMock.mockResolvedValue(reply(200, { notice: { text: 'x' }, submissions: [] }));
    const { body } = await call('get_submissions', { form_id: 'f1' });
    expect(body.notice).toContain('untrusted data');
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

  it('tells the agent to save a new agent key when none is set', async () => {
    fetchMock.mockResolvedValue(reply(201, { form_id: 'f1', agent_key: 'fh_agent_x' }));
    const { body } = await call('publish_form', { definition: linear });
    expect(body.agent_key_instructions).toContain('FORMHAUS_API_KEY');
    expect(body.agent_key_instructions).toContain('restart');
  });

  it('omits the agent key instructions when a key is set', async () => {
    vi.stubEnv('FORMHAUS_API_KEY', 'fh_agent_x');
    fetchMock.mockResolvedValue(reply(201, { form_id: 'f1', agent_key: 'fh_agent_x' }));
    const { body } = await call('publish_form', { definition: linear });
    expect(body.agent_key_instructions).toBeUndefined();
  });

  it('describes agent and account keys in list_forms', async () => {
    const { tools } = await client.listTools();
    const description = tools.find((tool) => tool.name === 'list_forms')!.description!;
    expect(description).toContain('fh_agent_');
    expect(description).toContain('fh_live_');
  });
});

describe('update_form_settings', () => {
  beforeEach(() => vi.stubEnv('FORMHAUS_API_KEY', 'fh_live_abc'));

  it('patches only the given settings', async () => {
    fetchMock.mockResolvedValue(reply(200, { form_id: 'f1', status: 'paused' }));
    const { isError, body } = await call('update_form_settings', { form_id: 'f1', status: 'paused', notify_email: true, notify_mode: 'daily' });
    expect(isError).toBe(false);
    expect(body.status).toBe('paused');
    const { url, init } = lastRequest();
    expect(url).toBe('https://api.example.test/v1/forms/f1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body!)).toEqual({ status: 'paused', notify_email: true, notify_mode: 'daily' });
  });

  it('reveals the webhook secret', async () => {
    fetchMock
      .mockResolvedValueOnce(reply(200, { form_id: 'f1', webhook_url: 'https://example.com/hook', webhook_secret: 'whsec_abc...' }))
      .mockResolvedValueOnce(reply(200, { url: 'https://example.com/hook', secret: 'whsec_full' }));
    const { body } = await call('update_form_settings', { form_id: 'f1', webhook_url: 'https://example.com/hook', reveal_secret: true });
    expect(body.webhook_secret).toBe('whsec_full');
    expect(lastRequest().url).toBe('https://api.example.test/v1/forms/f1/webhook?reveal=true');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ webhook_url: 'https://example.com/hook' });
  });

  it('skips the secret request without a webhook', async () => {
    fetchMock.mockResolvedValue(reply(200, { form_id: 'f1', webhook_url: '' }));
    await call('update_form_settings', { form_id: 'f1', reveal_secret: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(['owner_key_required', 'paused_by_moderation'])('maps the %s error', async (code) => {
    fetchMock.mockResolvedValue(reply(403, { error: code }));
    const { isError, body } = await call('update_form_settings', { form_id: 'f1', status: 'active' });
    expect(isError).toBe(true);
    expect(body.error).toBe(code);
  });

  it('returns validation messages', async () => {
    fetchMock.mockResolvedValue(reply(400, { error: 'webhook_url must be a public https URL' }));
    const { isError, body } = await call('update_form_settings', { form_id: 'f1', webhook_url: 'http://10.0.0.1' });
    expect(isError).toBe(true);
    expect(body.error).toContain('webhook_url');
  });

  it('requires an API key', async () => {
    vi.stubEnv('FORMHAUS_API_KEY', '');
    const { isError, body } = await call('update_form_settings', { form_id: 'f1', status: 'paused' });
    expect(isError).toBe(true);
    expect(body.error).toContain('FORMHAUS_API_KEY');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
