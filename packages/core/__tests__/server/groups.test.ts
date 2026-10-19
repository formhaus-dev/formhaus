import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormGroup, FormNode } from '../../src/types';

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
    expect(validateSubmission(definition, { people: items }).errors).toEqual({ people: 'At most 3 allowed' });
    expect(engine.validate()).toEqual({ people: 'At most 3 allowed' });
  });

  it('omits values that are not lists of plain objects and drops unknown item keys', () => {
    expect(validateSubmission(group(), { people: 'Ada' })).toEqual({ values: {}, errors: { people: 'Invalid value' } });
    expect(validateSubmission(group(), { people: [{ name: 'Ada' }, 5] })).toEqual({ values: {}, errors: { people: 'Invalid value' } });
    expect(validateSubmission(group(), { people: [{ name: 'Ada', admin: true, __proto__: { x: 1 } }] }).values).toEqual({
      people: [{ name: 'Ada' }],
    });
  });
});

describe('validateSubmission with a key shared by exclusive branches', () => {
  const people = (maxLength: number): FormGroup => ({
    key: 'answer',
    type: 'group',
    label: 'People',
    validation: { maxLength },
    fields: [{ key: 'name', type: 'text', label: 'Name' }],
  });
  const branches = (left: FormNode, right: FormNode): FormDefinition => ({
    formatVersion: '1.1',
    id: 'b',
    title: 'B',
    submit: { label: 'Send' },
    steps: [
      {
        id: 'choose',
        title: 'Choose',
        fields: [
          {
            key: 'route',
            type: 'radio',
            label: 'Route',
            options: [
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ],
          },
        ],
        routes: [{ to: 'left', show: [{ field: 'route', eq: 'left' }] }, { to: 'right' }],
      },
      { id: 'left', title: 'Left', fields: [left], routes: [{ to: null }] },
      { id: 'right', title: 'Right', fields: [right] },
    ],
  });
  const text: FormNode = { key: 'answer', type: 'text', label: 'Answer' };
  const two = [{ name: 'Ada' }, { name: 'Bo' }];

  it.each([
    ['group, text', branches(people(1), text), 'right'],
    ['text, group', branches(text, people(1)), 'left'],
  ])('checks the active text field when the other branch has a group (%s)', (_, definition, route) => {
    expect(validateSubmission(definition, { route, answer: 'Ada' })).toEqual({ values: { route, answer: 'Ada' }, errors: {} });
    expect(validateSubmission(definition, { route, answer: two })).toEqual({ values: { route }, errors: { answer: 'Must be text' } });
  });

  it.each([
    ['1, 3', branches(people(1), people(3)), 'right', 'left'],
    ['3, 1', branches(people(3), people(1)), 'left', 'right'],
  ])('applies the limit of the active group (%s)', (_, definition, wide, narrow) => {
    expect(validateSubmission(definition, { route: wide, answer: two })).toEqual({ values: { route: wide, answer: two }, errors: {} });
    expect(validateSubmission(definition, { route: narrow, answer: two })).toEqual({
      values: { route: narrow },
      errors: { answer: 'At most 1 allowed' },
    });
  });

  it('rejects 100,000 items without checking them', () => {
    const definition = branches(people(3), text);
    const items = Array.from({ length: 100_000 }, () => ({}));
    for (const route of ['left', 'right']) {
      let result = validateSubmission(definition, { route, answer: items });
      expect(timed(() => (result = validateSubmission(definition, { route, answer: items })))).toBeLessThan(50);
      expect(result.values).toEqual({ route });
      expect(Object.keys(result.errors)).toEqual(['answer']);
    }
  });
});
