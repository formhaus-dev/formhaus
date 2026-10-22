import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormGroup, FormNode } from '../../src/types';
import { countReads } from './reads';

const group = (validation?: FormGroup['validation']): FormDefinition => ({
  formatVersion: '1.1',
  id: 'g',
  title: 'G',
  submit: { label: 'Send' },
  fields: [{ key: 'people', type: 'group', label: 'People', validation, fields: [{ key: 'name', type: 'text', label: 'Name' }] }],
});

describe('validateSubmission with oversized or invalid groups', () => {
  it('rejects one item over the limit without reading any item', () => {
    for (const definition of [group({ maxLength: 3 }), group()]) {
      const items = countReads(Array.from({ length: 101 }, () => ({})));
      const result = validateSubmission(definition, { people: items.list });
      expect(items.reads()).toBe(0);
      expect(result.values).toEqual({});
      expect(Object.keys(result.errors)).toEqual(['people']);
    }
  });

  it('reads invalid cells a fixed number of times per cell', () => {
    const fields = Array.from({ length: 50 }, (_, index) => ({ key: `t${index}`, type: 'text' as const, label: 'T' }));
    const definition: FormDefinition = { ...group(), fields: [{ key: 'people', type: 'group', label: 'People', fields }] };
    const run = (length: number) => {
      const items = countReads(Array.from({ length }, () => Object.fromEntries(fields.map(({ key }) => [key, {}]))));
      return { result: validateSubmission(definition, { people: items.entries() }), reads: items.reads() };
    };
    const half = run(50);
    const full = run(100);
    expect(full.reads).toBe(2 * half.reads);
    expect(Object.keys(full.result.errors)).toHaveLength(5000);
    expect(full.result.errors['people.99.t49']).toBe('Must be text');
    expect(full.result.values).toEqual({ people: Array.from({ length: 100 }, () => ({})) });
  });

  it('reports the client message for too many items', () => {
    const definition = group({ maxLength: 3 });
    const items = Array.from({ length: 101 }, () => ({ name: 'A' }));
    const engine = new FormEngine(definition, { people: items });
    expect(validateSubmission(definition, { people: items }).errors).toEqual({ people: 'At most 3 allowed' });
    expect(engine.validate()).toEqual({ people: 'At most 3 allowed' });
  });

  it('validates no item of a group with too many items or a non-object item', () => {
    const name = { key: 'name', type: 'text' as const, label: 'Name', validation: { required: true } };
    for (const [validation, items, error] of [
      [{ maxLength: 2 }, [{}, {}, {}], 'At most 2 allowed'],
      [undefined, Array.from({ length: 101 }, () => ({})), 'Invalid value'],
      [undefined, [{}, 5], 'Invalid value'],
    ] as const) {
      const definition: FormDefinition = {
        ...group(),
        fields: [{ key: 'people', type: 'group', label: 'People', validation, fields: [name] }],
      };
      expect(validateSubmission(definition, { people: items })).toEqual({ values: {}, errors: { people: error } });
      expect(new FormEngine(definition, { people: items }).validate()).toEqual({ people: error });
    }
  });

  it('rejects repeated options in an item multiselect', () => {
    const roles = {
      key: 'roles',
      type: 'multiselect' as const,
      label: 'Roles',
      options: [
        { value: 'x', label: 'X' },
        { value: 'y', label: 'Y' },
      ],
    };
    const definition: FormDefinition = { ...group(), fields: [{ key: 'people', type: 'group', label: 'People', fields: [roles] }] };
    const values = { people: [{ roles: ['x', 'y'] }, { roles: ['x', 'x'] }] };
    const errors = { 'people.1.roles': 'Must be a list of available options' };
    expect(validateSubmission(definition, values).errors).toEqual(errors);
    expect(new FormEngine(definition, values).validate()).toEqual(errors);
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

  it('rejects one item over the limit without reading any item', () => {
    const definition = branches(people(3), text);
    for (const route of ['left', 'right']) {
      const items = countReads(Array.from({ length: 101 }, () => ({})));
      const result = validateSubmission(definition, { route, answer: items.list });
      expect(items.reads()).toBe(0);
      expect(result.values).toEqual({ route });
      expect(Object.keys(result.errors)).toEqual(['answer']);
    }
  });
});

describe('validateSubmission with an oversized multiselect inside group items', () => {
  const roles: FormNode = {
    key: 'roles',
    type: 'multiselect',
    label: 'Roles',
    options: [
      { value: 'x', label: 'X' },
      { value: 'y', label: 'Y' },
    ],
  };
  const shown = Array.from(
    { length: 50 },
    (_, index): FormNode => ({
      key: `t${index}`,
      type: 'text',
      label: 'T',
      show: [index % 2 ? { field: 'roles', contains: `q${index}` } : { field: 'roles', notContains: `q${index}` }],
    }),
  );
  const definition: FormDefinition = {
    ...group(),
    fields: [
      {
        key: 'people',
        type: 'group',
        label: 'People',
        fields: [roles, { key: 'picked', type: 'text', label: 'Picked', show: [{ field: 'roles', contains: 'x' }] }, ...shown],
      },
    ],
  };

  it('blanks a value over the item limit in each of 100 items before conditions read it', () => {
    const huge = countReads(Array.from({ length: 1001 }, () => 'x'));
    const items = Array.from({ length: 100 }, () => ({ roles: huge.list, picked: 'smuggled', t0: 'kept', t1: 'hidden' }));
    const result = validateSubmission(definition, { people: items });
    expect(huge.reads()).toBe(0);
    expect(Object.keys(result.errors)).toHaveLength(100);
    expect(result.errors['people.99.roles']).toBe('Select one of the available options');
    expect(result.values).toEqual({ people: Array.from({ length: 100 }, () => ({ t0: 'kept' })) });
    const engine = new FormEngine(definition, { people: items });
    expect(engine.items('people')[0].fields.map(({ key }) => key)).toEqual([
      'roles',
      ...shown.filter((_, index) => index % 2 === 0).map(({ key }) => key),
    ]);
    expect(engine.validate()['people.99.roles']).toBe(result.errors['people.99.roles']);
    expect(huge.reads()).toBe(0);
  });

  it('blanks a string value and keeps the client message', () => {
    const values = {
      people: [
        { roles: 'x', picked: 'p' },
        { roles: ['x'], picked: 'p' },
      ],
    };
    const errors = { 'people.0.roles': 'Must be a list of available options' };
    expect(validateSubmission(definition, values)).toEqual({ values: { people: [{}, { roles: ['x'], picked: 'p' }] }, errors });
    expect(new FormEngine(definition, values).validate()).toEqual(errors);
  });
});
