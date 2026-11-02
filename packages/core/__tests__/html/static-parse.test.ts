import { describe, expect, it } from 'vitest';
import type { FormDefinition } from '../../src';
import { parseFormData } from '../../src/html';
import { form } from './fixtures';

const definition = form([
  { key: 'agree', type: 'checkbox', label: 'Agree', defaultValue: true },
  { key: 'news', type: 'switch', label: 'News' },
  {
    key: 'tags',
    type: 'multiselect',
    label: 'Tags',
    options: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
  },
  { key: 'age', type: 'number', label: 'Age' },
  { key: 'stars', type: 'rating', label: 'Stars' },
  { key: 'mood', type: 'radio', label: 'Mood', options: [{ value: 'x', label: 'X' }] },
  { key: 'city', type: 'autocomplete', label: 'City', options: [{ value: 'de', label: 'Germany' }] },
  { key: 'note', type: 'textarea', label: 'Note' },
]);

describe('parseFormData', () => {
  it('types each control', () => {
    expect(
      parseFormData(definition, {
        agree: 'on',
        news: 'on',
        tags: ['a', 'b'],
        age: '4.5',
        stars: '3',
        mood: 'x',
        city: 'Germany',
        note: 'hi',
      }),
    ).toEqual({ agree: true, news: true, tags: ['a', 'b'], age: 4.5, stars: 3, mood: 'x', city: 'de', note: 'hi' });
  });

  it('reads an unchecked box as false, even with a default of true, and no options as an empty list', () => {
    expect(parseFormData(definition, {})).toEqual({ agree: false, news: false, tags: [] });
  });

  it('reads an empty number as null and keeps text that is not a number', () => {
    expect(parseFormData(definition, { age: '' }).age).toBeNull();
    expect(parseFormData(definition, { age: 'abc' }).age).toBe('abc');
  });

  it('keeps autocomplete text that matches no option', () => {
    expect(parseFormData(definition, { city: 'Atlantis' }).city).toBe('Atlantis');
  });

  it('ignores names the definition does not know', () => {
    expect(parseFormData(definition, JSON.parse('{"__proto__":"x","constructor":"y","other":"z"}'))).toEqual({
      agree: false,
      news: false,
      tags: [],
    });
  });

  it('takes the first of a repeated name and reads options from the call for fields that load them', () => {
    const loaded = form([{ key: 'c', type: 'autocomplete', label: 'C', optionsFrom: 'x' }]);
    expect(parseFormData(loaded, { c: ['Germany', 'France'] }, { options: { c: [{ value: 'de', label: 'Germany' }] } })).toEqual({
      c: 'de',
    });
  });
});

describe('repeated names', () => {
  it('keeps at most the number of options for a multiselect', () => {
    const many = Array.from({ length: 50 }, () => 'a');
    expect(parseFormData(definition, { tags: many }).tags).toEqual(['a', 'a']);
  });

  it('keeps at most 1000 values of a name', () => {
    const open = form([{ key: 'tags', type: 'multiselect', label: 'T' }]);
    expect(parseFormData(open, { tags: Array.from({ length: 5000 }, () => 'a') }).tags).toHaveLength(1000);
    const entries = { entries: () => Array.from({ length: 5000 }, () => ['tags', 'a'] as const) };
    expect(parseFormData(open, entries).tags).toHaveLength(1000);
  });
});

describe('parseFormData input', () => {
  it('reads FormData-like entries, URLSearchParams and Map', () => {
    expect(parseFormData(definition, new URLSearchParams([['note', 'x']])).note).toBe('x');
    expect(parseFormData(definition, new Map([['note', 'y']]) as never).note).toBe('y');
  });

  it('skips entries that are not strings', () => {
    expect(parseFormData(definition, { entries: () => [['note', { name: 'file.txt' }]] }).note).toBeUndefined();
  });

  it.each([null, undefined, 'text', 4, [['note', 'x']]])('throws for %j', (input) => {
    expect(() => parseFormData(definition, input as never)).toThrow(TypeError);
  });

  it('throws for a definition with steps', () => {
    expect(() =>
      parseFormData({ id: 'f', title: 'T', submit: { label: 'Go' }, steps: [{ id: 'a', title: 'A', fields: [] }] } as FormDefinition, {}),
    ).toThrow(/steps/);
  });
});
