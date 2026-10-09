import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isAiMessage, runAiMessage } from '../ai-keys';

let storage: Record<string, unknown>;

beforeEach(() => {
  storage = {};
  vi.stubGlobal('figma', {
    clientStorage: {
      getAsync: async (key: string) => storage[key],
      setAsync: async (key: string, value: unknown) => { storage[key] = structuredClone(value); },
    },
  });
});

describe('AI key storage', () => {
  it('handles only its own messages', () => {
    expect(['getAiSettings', 'saveAiKey', 'forgetAiKey'].every(isAiMessage)).toBe(true);
    expect(isAiMessage('generate')).toBe(false);
  });

  it('starts with Anthropic and no keys', async () => {
    expect(await runAiMessage({ type: 'getAiSettings' })).toEqual({ type: 'aiSettings', provider: 'anthropic', keys: {} });
    expect(storage).toEqual({});
  });

  it('saves a key per provider in client storage and remembers the provider', async () => {
    await runAiMessage({ type: 'saveAiKey', provider: 'anthropic', key: ' sk-ant ' });
    const reply = await runAiMessage({ type: 'saveAiKey', provider: 'openai', key: 'sk-oa' });
    expect(reply).toEqual({ type: 'aiSettings', provider: 'openai', keys: { anthropic: 'sk-ant', openai: 'sk-oa' } });
    expect(storage['formhaus.ai']).toEqual({ provider: 'openai', keys: { anthropic: 'sk-ant', openai: 'sk-oa' } });
  });

  it('forgets one key', async () => {
    await runAiMessage({ type: 'saveAiKey', provider: 'anthropic', key: 'sk-ant' });
    await runAiMessage({ type: 'saveAiKey', provider: 'openai', key: 'sk-oa' });
    const reply = await runAiMessage({ type: 'forgetAiKey', provider: 'anthropic' });
    expect(reply.keys).toEqual({ openai: 'sk-oa' });
  });

  it('ignores unknown providers', async () => {
    const reply = await runAiMessage({ type: 'saveAiKey', provider: 'other' as never, key: 'x' });
    expect(reply).toEqual({ type: 'aiSettings', provider: 'anthropic', keys: {} });
    expect(storage).toEqual({});
  });
});
