import { describe, expect, it } from 'vitest';
import { applyFix, type PatchOperation } from '../../src/fix';

const source = () => ({
  id: 'f',
  fields: [
    { key: 'a', label: 'A' },
    { key: 'b', label: 'B' },
  ],
  submit: { label: 'Send' },
});

describe('applyFix', () => {
  it('returns a new object and leaves the input untouched', () => {
    const definition = source();
    const fixed = applyFix(definition, [{ op: 'replace', path: '/fields/0/label', value: 'Name' }]);
    expect(fixed.fields[0].label).toBe('Name');
    expect(definition).toEqual(source());
    expect(fixed.submit).not.toBe(definition.submit);
  });

  it('applies add, replace, remove and move in order', () => {
    const fixed = applyFix(source(), [
      { op: 'add', path: '/fields/-', value: { key: 'c' } },
      { op: 'add', path: '/fields/0', value: { key: 'z' } },
      { op: 'remove', path: '/fields/1' },
      { op: 'move', from: '/submit/label', path: '/submit/text' },
      { op: 'replace', path: '/id', value: 'g' },
    ]);
    expect(fixed).toEqual({ id: 'g', fields: [{ key: 'z' }, { key: 'b', label: 'B' }, { key: 'c' }], submit: { text: 'Send' } });
  });

  it('puts a new id or key first so the JSON reads naturally', () => {
    const fixed = applyFix({ title: 'T', fields: [{ type: 'text', label: 'Name' }] }, [
      { op: 'add', path: '/id', value: 't' },
      { op: 'add', path: '/fields/0/key', value: 'name' },
    ]);
    expect(Object.keys(fixed)).toEqual(['id', 'title', 'fields']);
    expect(Object.keys(fixed.fields[0])).toEqual(['key', 'type', 'label']);
  });

  it('decodes escaped pointer tokens', () => {
    expect(
      applyFix({ 'a/b': 1, 'c~d': 2 }, [
        { op: 'remove', path: '/a~1b' },
        { op: 'replace', path: '/c~0d', value: 3 },
      ]),
    ).toEqual({ 'c~d': 3 });
  });

  it.each<[string, PatchOperation[]]>([
    ['a missing target', [{ op: 'remove', path: '/fields/5' }]],
    ['a missing parent', [{ op: 'add', path: '/steps/0/id', value: 'x' }]],
    ['replace of an absent member', [{ op: 'replace', path: '/title', value: 'x' }]],
    ['an array index past the end', [{ op: 'add', path: '/fields/3', value: {} }]],
    ['a path without a leading slash', [{ op: 'add', path: 'title', value: 'x' }]],
    ['the root', [{ op: 'replace', path: '', value: {} }]],
    ['a prototype key', [{ op: 'add', path: '/__proto__/polluted', value: true }]],
    ['a move into its own child', [{ op: 'move', from: '/submit', path: '/submit/inner' }]],
    ['an unsupported operation', [{ op: 'copy', from: '/id', path: '/title' } as unknown as PatchOperation]],
  ])('rejects %s without touching the input', (_, patch) => {
    const definition = source();
    expect(() => applyFix(definition, patch)).toThrow(/^Invalid patch: /);
    expect(definition).toEqual(source());
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('rejects a patch that is not an array', () => {
    expect(() => applyFix(source(), {} as unknown as PatchOperation[])).toThrow('Invalid patch: the patch must be an array of operations');
  });

  it('keeps an own __proto__ key as data when adding an id', () => {
    const input = JSON.parse('{"title":"T","__proto__":{"polluted":1}}') as Record<string, unknown>;
    const result = applyFix(input, [{ op: 'add', path: '/id', value: 'f' }]);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.hasOwn(result, '__proto__')).toBe(true);
    expect(result.id).toBe('f');
  });

  it('rejects a move without pointers', () => {
    expect(() => applyFix(source(), [{ op: 'move', path: 1 } as unknown as PatchOperation])).toThrow('Invalid patch');
  });
});
