import { createServer as createHttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { getDefaultEnvironment, StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { linear } from './fixtures';

const bin = fileURLToPath(new URL('../dist/cli.js', import.meta.url));
const client = new Client({ name: 'formhaus-test', version: '0.0.0' });

describe('formhaus-mcp over stdio', () => {
  beforeAll(async () => {
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [bin] }));
  });

  afterAll(async () => {
    await client.close();
  });

  it('lists tools and resources', async () => {
    const { tools } = await client.listTools();
    expect(tools.map(({ name }) => name).sort()).toEqual([
      'capabilities',
      'example_definitions',
      'fix_definition',
      'get_submissions',
      'get_webhook',
      'list_forms',
      'publish_form',
      'reveal_webhook_secret',
      'simulate_path',
      'translation_template',
      'update_form_settings',
      'validate_definition',
    ]);
    const { resources } = await client.listResources();
    expect(resources.map(({ uri }) => uri)).toEqual(['formhaus://capabilities']);
  });

  it('sends server instructions on initialize', () => {
    const instructions = client.getInstructions();
    expect(instructions).toContain('validate_definition');
    expect(instructions).toContain('FORMHAUS_API_KEY');
    expect(instructions).toContain('FORMHAUS_API_BASE');
  });

  it('returns structured content from validate_definition', async () => {
    const result = await client.callTool({ name: 'validate_definition', arguments: { definition: linear } });
    expect(result.structuredContent).toEqual({ valid: true, issues: [] });
  });

  it('returns the repaired definition from fix_definition', async () => {
    const { submit: _, ...definition } = linear;
    const result = await client.callTool({ name: 'fix_definition', arguments: { definition } });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({ valid: true, definition: { submit: { label: 'Submit' } } });
  });

  it('calls simulate_path', async () => {
    const result = await client.callTool({
      name: 'simulate_path',
      arguments: { definition: linear, answers: { name: 'Ada', email: 'a@b.co' } },
    });
    const [content] = result.content as { type: string; text: string }[];
    expect(JSON.parse(content.text)).toMatchObject({ ok: true, wouldSubmit: true });
  });

  it('returns capabilities that match the output schema', async () => {
    const result = await client.callTool({ name: 'capabilities', arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({ customFieldTypes: expect.any(String), adapters: expect.any(Array) });
  });
});

describe('cloud tools over stdio', () => {
  const bodies: Record<string, unknown> = {
    'POST /v1/forms': { form_id: 'f1', version: 2, endpoint: 'https://api.example.test/f/f1', agent_key: 'fh_agent_x' },
    'GET /v1/forms': { forms: [{ form_id: 'f1', title: 'Signup', status: 'active' }] },
    'GET /v1/forms/f1/submissions': { submissions: [{ id: 's1', values: { name: 'Ada' } }], next_cursor: null },
    'PATCH /v1/forms/f1': { form_id: 'f1', status: 'paused', notify_mode: 'off' },
    'GET /v1/forms/f1/webhook': { url: 'https://example.com/hook', secret: 'whsec_full_secret_1234' },
  };
  const api = createHttpServer((request, response) => {
    const body = bodies[`${request.method} ${request.url?.split('?')[0]}`];
    response.writeHead(body ? 200 : 404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(body ?? { error: 'not_found' }));
  });
  const cloud = new Client({ name: 'formhaus-test', version: '0.0.0' });

  beforeAll(async () => {
    await new Promise<void>((resolve) => api.listen(0, '127.0.0.1', resolve));
    const { port } = api.address() as AddressInfo;
    const env = { ...getDefaultEnvironment(), FORMHAUS_API_KEY: 'fh_live_abc', FORMHAUS_API_BASE: `http://127.0.0.1:${port}` };
    await cloud.connect(new StdioClientTransport({ command: process.execPath, args: [bin], env }));
    await cloud.listTools();
  });

  afterAll(async () => {
    await cloud.close();
    api.close();
  });

  it.each([
    ['publish_form', { definition: linear }],
    ['list_forms', {}],
    ['get_submissions', { form_id: 'f1' }],
    ['update_form_settings', { form_id: 'f1', status: 'paused' }],
    ['get_webhook', { form_id: 'f1' }],
    ['reveal_webhook_secret', { form_id: 'f1' }],
  ])('returns %s success output that matches its schema', async (name, args) => {
    const result = await cloud.callTool({ name, arguments: args });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toBeDefined();
  });
});
