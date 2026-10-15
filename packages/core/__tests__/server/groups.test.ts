import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormGroup } from '../../src/types';

const group = (validation?: FormGroup['validation']): FormDefinition => ({
  formatVersion: '1.1',
  id: 'g',
  title: 'G',
  submit: { label: 'Send' },
  fields: [{ key: 'people', type: 'group', label: 'People', validation, fields: [{ key: 'name', type: 'text', label: 'Name' }] }],
});

const timed = (run: () => void) => {
  run();
  const start = performance.now();
  run();
  return performance.now() - start;
};

describe('validateSubmission with oversized or invalid groups', () => {
  it('rejects 100,000 items without checking them', () => {
    const items = Array.from({ length: 100_000 }, () => ({}));
    for (const definition of [group({ maxLength: 3 }), group()]) {
      let result = validateSubmission(definition, { people: items });
      expect(
        timed(() => {
          result = validateSubmission(definition, { people: items });
        }),
      ).toBeLessThan(50);
      expect(result.values).toEqual({});
      expect(Object.keys(result.errors)).toEqual(['people']);
    }
  });

  it('checks 100 items of 50 invalid cells in linear time', () => {
    const fields = Array.from({ length: 50 }, (_, index) => ({ key: `t${index}`, type: 'text' as const, label: 'T' }));
    const definition: FormDefinition = { ...group(), fields: [{ key: 'people', type: 'group', label: 'People', fields }] };
    const items = Array.from({ length: 100 }, () => Object.fromEntries(fields.map(({ key }) => [key, {}])));
    let result = validateSubmission(definition, { people: items });
    expect(timed(() => (result = validateSubmission(definition, { people: items })))).toBeLessThan(1000);
    expect(Object.keys(result.errors)).toHaveLength(5000);
    expect(result.errors['people.99.t49']).toBe('Must be text');
    expect(result.values).toEqual({ people: Array.from({ length: 100 }, () => ({})) });
  });

  it('reports the client message for too many items', () => {
    const definition = group({ maxLength: 3 });
    const items = Array.from({ length: 101 }, () => ({ name: 'A' }));
    const engine = new FormEngine(definition, { people: items });
    expect(validateSubmission(definition, { people: items }).errors).toEqual({ people: 'Must be at most 3 items' });
    expect(engine.validate()).toEqual({ people: 'Must be at most 3 items' });
  });

  it('omits values that are not lists of plain objects and drops unknown item keys', () => {
    expect(validateSubmission(group(), { people: 'Ada' })).toEqual({ values: {}, errors: { people: 'Invalid value' } });
    expect(validateSubmission(group(), { people: [{ name: 'Ada' }, 5] })).toEqual({ values: {}, errors: { people: 'Invalid value' } });
    expect(validateSubmission(group(), { people: [{ name: 'Ada', admin: true, __proto__: { x: 1 } }] }).values).toEqual({
      people: [{ name: 'Ada' }],
    });
  });
});
