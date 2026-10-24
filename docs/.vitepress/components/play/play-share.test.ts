import { describe, expect, it } from 'vitest';
import { errorOffset, issueMarks, readHash, syntaxError, writeHash } from './play-share';

const errorOf = (text: string) => {
  try {
    JSON.parse(text);
  } catch (error) {
    return error;
  }
  throw new Error('valid JSON');
};

describe('share hash', () => {
  it('round trips an edited definition with the design and width', async () => {
    const text = '{\n  "title": "Ünïcode ✓ form",\n  "fields": []\n}\n';
    const hash = await writeHash({ design: 'mui', width: 'phone', preset: 'survey', text });
    expect(hash).toMatch(/^#ds=mui&w=phone&p=survey&d=[\w-]+$/);
    expect(await readHash(hash)).toEqual({ design: 'mui', width: 'phone', preset: 'survey', template: undefined, text });
  });

  it('packs a definition larger than one argument list', async () => {
    const text = JSON.stringify({
      fields: Array.from({ length: 4000 }, (_, index) => ({ key: `f${index}`, label: Math.random().toString(36) })),
    });
    expect((await readHash(await writeHash({ text }))).text).toBe(text);
  });

  it('keeps only the preset when the text is unchanged', async () => {
    const hash = await writeHash({ design: 'react', width: 'desktop', preset: 'survey' });
    expect(hash).toBe('#ds=react&p=survey');
    expect(await readHash(hash)).toEqual({ design: 'react', width: undefined, preset: 'survey', template: undefined, text: undefined });
  });

  it('links a template by its slug and keeps it next to edits', async () => {
    const hash = await writeHash({ design: 'antd', template: 'contact-form' });
    expect(hash).toBe('#ds=antd&t=contact-form');
    expect((await readHash(hash)).template).toBe('contact-form');
    const edited = await readHash(await writeHash({ template: 'contact-form', text: '{}' }));
    expect(edited).toMatchObject({ template: 'contact-form', text: '{}' });
  });

  it('drops a damaged payload', async () => {
    expect((await readHash('#ds=vuetify&d=not-deflate')).text).toBeUndefined();
  });
});

describe('JSON error line', () => {
  const cases: [string, string, number][] = [
    ['missing comma', '{\n  "a": 1\n  "b": 2\n}', 3],
    ['trailing comma', '{\n  "fields": [\n    1,\n  ]\n}', 4],
    ['unclosed array', '{\n  "fields": [\n', 3],
    ['bad literal', '{\n  "a": tru\n}', 2],
    ['empty text', '', 1],
    ['text after the value', '{}\n\nx', 3],
    ['control character in a string', '{\n  "a": "x\ty"\n}', 2],
  ];

  it.each(cases)('finds the line of a %s', (_, text, line) => {
    expect(syntaxError(text, errorOf(text)).line).toBe(line);
  });

  it('accepts valid JSON to the end', () => {
    const text = '{"a":[1,-2.5e3,true,false,null,"\\"q\\""],"b":{}}';
    expect(errorOffset(text)).toBe(text.length);
  });

  it('cleans engine messages', () => {
    const messages = [
      ["Expected ',' or '}' after property value in JSON at position 11 (line 2 column 3)", "Expected ',' or '}' after property value"],
      [
        "JSON.parse: expected ',' or '}' after property value in object at line 2 column 3 of the JSON data",
        "Expected ',' or '}' after property value",
      ],
      ["JSON Parse error: Expected '}'", "Expected '}'"],
      ['Unexpected end of JSON input', 'Unexpected end of JSON input'],
    ];
    for (const [raw, clean] of messages) expect(syntaxError('{', new SyntaxError(raw)).message).toBe(clean);
  });
});

describe('issue marks', () => {
  it('marks the key of the field an issue points at', () => {
    const text = '{\n  "fields": [\n    { "key": "a", "type": "nope" }\n  ]\n}';
    const [mark] = issueMarks(text, [{ path: '/fields/0/type', message: '/fields/0/type: unknown type', severity: 'error' }]);
    expect(text.slice(mark!.from, mark!.from + 6)).toBe('"type"');
    expect(mark!.message).toBe('unknown type');
  });

  it('falls back to the closest parent', () => {
    const text = '{ "fields": [] }';
    const [mark] = issueMarks(text, [{ path: '/fields/3/key', message: 'missing', severity: 'error' }]);
    expect(text.slice(mark!.from, mark!.from + 8)).toBe('"fields"');
  });
});
