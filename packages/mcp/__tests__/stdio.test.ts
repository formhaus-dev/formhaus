import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
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
    expect(tools.map(({ name }) => name).sort()).toEqual(['capabilities', 'example_definitions', 'simulate_path', 'validate_definition']);
    const { resources } = await client.listResources();
    expect(resources.map(({ uri }) => uri)).toEqual(['formhaus://capabilities']);
  });

  it('returns structured content from validate_definition', async () => {
    const result = await client.callTool({ name: 'validate_definition', arguments: { definition: linear } });
    expect(result.structuredContent).toEqual({ valid: true, errors: [], warnings: [] });
  });

  it('calls simulate_path', async () => {
    const result = await client.callTool({ name: 'simulate_path', arguments: { definition: linear, answers: { name: 'Ada', email: 'a@b.co' } } });
    const [content] = result.content as { type: string; text: string }[];
    expect(JSON.parse(content.text)).toMatchObject({ ok: true, wouldSubmit: true });
  });
});
