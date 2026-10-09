import { describe, expect, it } from 'vitest';
import { firstJsonObject, repairMessage, requestMessage, SCHEMA_URL, SYSTEM_PROMPT } from '../ui/ai/prompt';

describe('AI prompt', () => {
  it('states the definition rules the plugin relies on', () => {
    for (const rule of ['"eq"', '"neq"', '"in"', '"notIn"', '"notEmpty"', 'routes', 'camelCase', 'showAny', SCHEMA_URL]) {
      expect(SYSTEM_PROMPT).toContain(rule);
    }
  });

  it('asks for a new form from the description', () => {
    expect(requestMessage('  A contact form  ')).toEqual({ role: 'user', content: 'Create this form:\nA contact form' });
  });

  it('sends the current form when editing', () => {
    const current = { id: 'signup', title: 'Sign up', submit: { label: 'Go' }, fields: [] };
    const message = requestMessage('Add a phone field', current);
    expect(message.content).toContain(JSON.stringify(current));
    expect(message.content).toContain('Keep the id');
    expect(message.content.endsWith('Add a phone field')).toBe(true);
  });

  it('lists the errors to repair', () => {
    expect(repairMessage(['First', 'Second']).content).toBe('That definition has problems:\n- First\n- Second\nReturn the corrected JSON object only.');
  });
});

describe('firstJsonObject', () => {
  it('reads an object wrapped in prose and fences', () => {
    expect(firstJsonObject('Here you go:\n```json\n{"id":"a","nested":{"b":[1,2]}}\n```\nDone {not json}')).toEqual({ id: 'a', nested: { b: [1, 2] } });
  });

  it('ignores braces and escaped quotes inside strings', () => {
    expect(firstJsonObject('{"label":"Use {name} and \\"quotes\\" }"}')).toEqual({ label: 'Use {name} and "quotes" }' });
  });

  it('rejects replies without a complete object', () => {
    expect(() => firstJsonObject('Sorry, I cannot help.')).toThrow('no JSON object');
    expect(() => firstJsonObject('{"id": "a"')).toThrow('unfinished');
  });
});
