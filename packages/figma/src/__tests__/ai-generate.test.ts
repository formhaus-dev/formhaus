import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkReply, generateDefinition } from '../ui/ai/generate';
import { SCHEMA_URL } from '../ui/ai/prompt';

const valid = { id: 'contact', title: 'Contact', submit: { label: 'Send' }, fields: [{ key: 'email', type: 'email', label: 'Email' }] };
const badRoute = {
  id: 'flow',
  title: 'Flow',
  submit: { label: 'Done' },
  steps: [{ id: 'one', title: 'One', fields: [], routes: [{ to: 'missing' }] }],
};

const withWarning = { ...valid, fields: [{ ...valid.fields[0], show: [{ field: 'ghost', notEmpty: true }] }] };

type Reply = { status?: number; headers?: Record<string, string>; body: unknown };

function mockFetch(...replies: Reply[]) {
  const fetch = vi.fn(async () => {
    const reply = replies.shift();
    if (!reply) throw new Error('Unexpected request');
    return new Response(JSON.stringify(reply.body), { status: reply.status ?? 200, headers: reply.headers });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

const anthropic = (value: unknown, stop_reason = 'end_turn'): Reply => ({ body: { stop_reason, content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }] } });
const openai = (value: unknown, choice: Record<string, unknown> = {}): Reply => ({ body: { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) }, ...choice }] } });
const sent = (fetch: ReturnType<typeof mockFetch>, call: number) => {
  const [url, init] = fetch.mock.calls[call] as unknown as [string, RequestInit];
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) };
};

afterEach(() => vi.unstubAllGlobals());

describe('checkReply', () => {
  it('accepts a valid definition and sets our $schema', () => {
    const result = checkReply(JSON.stringify({ $schema: 'https://example.com/other.json', ...valid }));
    expect(result).toEqual({ definition: { ...valid, $schema: SCHEMA_URL }, fatal: [], warnings: [] });
  });

  it('reports missing parts as fatal', () => {
    expect(checkReply('{"title": "x"}').fatal).toEqual(['"id" must be a non-empty string.', '"submit" must be an object with a "label".', 'Add "fields" or "steps".']);
    expect(checkReply('{"id":"a","title":"A","submit":{"label":"Go"},"steps":[{"id":"s","fields":[{"key":"k"}]}]}').fatal).toEqual(['Step "s" field 1 needs "key", "type" and "label".']);
  });

  it('splits fatal route and structure errors from warnings', () => {
    expect(checkReply(JSON.stringify(badRoute)).fatal[0]).toMatch(/^Invalid route from "one" to "missing"/);
    expect(checkReply(JSON.stringify({ ...valid, steps: [{ id: 's', title: 'S', fields: [valid.fields[0]] }] })).fatal[0]).toMatch(/^Definition has both/);
    const result = checkReply(JSON.stringify(withWarning));
    expect(result.fatal).toEqual([]);
    expect(result.warnings).toEqual(['Field "email" has show condition referencing non-existent field "ghost"']);
  });
});

describe('generateDefinition', () => {
  it('calls Anthropic from the browser with the key and returns the form', async () => {
    const fetch = mockFetch(anthropic(`Sure:\n${JSON.stringify(valid)}`));
    const result = await generateDefinition({ provider: 'anthropic', key: 'sk-test', description: 'Contact form' });
    expect(result).toEqual({ definition: { ...valid, $schema: SCHEMA_URL }, warnings: [] });
    const request = sent(fetch, 0);
    expect(request.url).toBe('https://api.anthropic.com/v1/messages');
    expect(request.headers).toMatchObject({ 'x-api-key': 'sk-test', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' });
    expect(request.body).toMatchObject({ model: 'claude-sonnet-5-5', messages: [{ role: 'user', content: 'Create this form:\nContact form' }] });
    expect(request.body.system).toContain('Formhaus');
  });

  it('asks OpenAI for a JSON object', async () => {
    const fetch = mockFetch(openai(valid));
    await generateDefinition({ provider: 'openai', key: 'sk-oa', description: 'Contact form' });
    const request = sent(fetch, 0);
    expect(request.url).toBe('https://api.openai.com/v1/chat/completions');
    expect(request.headers.authorization).toBe('Bearer sk-oa');
    expect(request.body.response_format).toEqual({ type: 'json_object' });
    expect(request.body.messages[0].role).toBe('system');
  });

  it('sends the errors back once and uses the repaired form', async () => {
    const fetch = mockFetch(anthropic(badRoute), anthropic(valid));
    const result = await generateDefinition({ provider: 'anthropic', key: 'k', description: 'Flow' });
    expect(result.definition.id).toBe('contact');
    const messages = sent(fetch, 1).body.messages;
    expect(messages).toHaveLength(3);
    expect(messages[1]).toEqual({ role: 'assistant', content: JSON.stringify(badRoute) });
    expect(messages[2].content).toContain('missing');
  });

  it('returns warnings without a repair round', async () => {
    const fetch = mockFetch(anthropic(withWarning));
    const result = await generateDefinition({ provider: 'anthropic', key: 'k', description: 'x' });
    expect(result.warnings).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the best result when the repair reply is worse', async () => {
    mockFetch(anthropic(badRoute), anthropic('not json'));
    await expect(generateDefinition({ provider: 'anthropic', key: 'k', description: 'x' })).rejects.toThrow('The generated form is not valid: The reply has no JSON object.');
    mockFetch(anthropic(badRoute), anthropic(withWarning));
    expect((await generateDefinition({ provider: 'anthropic', key: 'k', description: 'x' })).warnings).toHaveLength(1);
  });

  it('reports cut-off and declined replies without repairing', async () => {
    const cases: [Reply, string][] = [
      [anthropic('{"id": "a", "title"', 'max_tokens'), 'The reply was cut off'],
      [anthropic('', 'refusal'), 'The model declined'],
      [openai(valid, { finish_reason: 'length' }), 'The reply was cut off'],
      [openai(null, { message: { content: null, refusal: 'No.' } }), 'The model declined'],
    ];
    for (const [reply, message] of cases) {
      const fetch = mockFetch(reply);
      const provider = 'choices' in (reply.body as object) ? 'openai' : 'anthropic';
      await expect(generateDefinition({ provider, key: 'k', description: 'x' })).rejects.toThrow(message);
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  });

  it('gives up after one repair round', async () => {
    const fetch = mockFetch(anthropic('no json'), anthropic(badRoute));
    await expect(generateDefinition({ provider: 'anthropic', key: 'k', description: 'Flow' })).rejects.toThrow('The generated form is not valid');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps the id of the form being edited', async () => {
    const fetch = mockFetch(anthropic({ ...valid, id: 'renamed' }));
    const current = { ...valid, id: 'canvas-form' };
    const result = await generateDefinition({ provider: 'anthropic', key: 'k', description: 'Add a name', current });
    expect(result.definition.id).toBe('canvas-form');
    expect(sent(fetch, 0).body.messages[0].content).toContain(JSON.stringify(current));
  });

  it('turns provider errors into readable messages', async () => {
    mockFetch({ status: 401, body: { type: 'error', error: { message: 'invalid x-api-key' } } });
    await expect(generateDefinition({ provider: 'anthropic', key: 'bad', description: 'x' })).rejects.toThrow('Check your API key (invalid x-api-key).');
    mockFetch({ status: 529, body: { error: { message: 'Overloaded' } } });
    await expect(generateDefinition({ provider: 'anthropic', key: 'k', description: 'x' })).rejects.toThrow('The provider is busy, try again in a moment.');
    mockFetch({ status: 429, headers: { 'retry-after': '20' }, body: { error: { message: 'Slow down' } } });
    await expect(generateDefinition({ provider: 'openai', key: 'k', description: 'x' })).rejects.toThrow('The provider is busy, try again in 20 seconds (Slow down).');
    mockFetch({ status: 500, body: { error: { message: 'Overloaded' } } });
    await expect(generateDefinition({ provider: 'openai', key: 'k', description: 'x' })).rejects.toThrow('The provider returned an error: Overloaded');
  });

  it('stops when cancelled', async () => {
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init: RequestInit) => {
      controller.abort();
      throw init.signal?.reason;
    }));
    await expect(generateDefinition({ provider: 'anthropic', key: 'k', description: 'x', signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
