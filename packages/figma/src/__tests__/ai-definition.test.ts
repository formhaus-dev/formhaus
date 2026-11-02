import { FormEngine, checkDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { aiDefinition } from '../ui/ai/ai-definition';

const keys = (editable: boolean) => aiDefinition(editable, false).fields?.map((field) => ('key' in field ? field.key : '')) ?? [];

describe('AI panel form', () => {
  it('passes the definition check in both modes', () => {
    for (const editable of [false, true])
      expect(checkDefinition(aiDefinition(editable, editable)).filter((issue) => issue.severity === 'error')).toEqual([]);
  });

  it('offers the target only when a form is open', () => {
    expect(keys(false)).toEqual(['prompt', 'provider', 'apiKey']);
    expect(keys(true)).toEqual(['target', 'prompt', 'provider', 'apiKey']);
  });

  it('words the prompt placeholder by target', () => {
    const placeholder = (editing: boolean) => aiDefinition(true, editing).fields?.find((field) => 'key' in field && field.key === 'prompt');
    expect(placeholder(false)).toMatchObject({ placeholder: 'Describe the form…' });
    expect(placeholder(true)).toMatchObject({ placeholder: 'Describe the change…' });
  });

  it('asks for a description and a key before submitting', async () => {
    const engine = new FormEngine(aiDefinition(false, false), { provider: 'anthropic', prompt: '   ', apiKey: '' });
    let submitted = false;
    await engine.submit(() => {
      submitted = true;
    });
    expect(submitted).toBe(false);
    expect(engine.errors).toEqual({ prompt: 'Describe the form first.', apiKey: 'Add your API key first.' });
  });
});
