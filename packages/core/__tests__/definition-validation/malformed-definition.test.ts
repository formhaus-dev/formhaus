import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormEngine, validateDefinition, type FormDefinition } from '../../src';
import { checkDefinition, validateSubmission } from '../../src/server';

const malformed: [string, unknown, string][] = [
  ['null', null, 'Form definition must be an object.'],
  ['an array', [], 'Form definition must be an object.'],
  ['fields as an object', { id: 'a', title: 'A', submit: { label: 'Go' }, fields: {} }, 'fields must be an array.'],
  ['a null field', { id: 'a', title: 'A', submit: { label: 'Go' }, fields: [null] }, 'fields[0] must be a field object.'],
  ['steps as a string', { id: 'a', title: 'A', submit: { label: 'Go' }, steps: 'one' }, 'steps must be an array.'],
  ['a step without fields', { id: 'a', title: 'A', submit: { label: 'Go' }, steps: [{ id: 's', title: 'S' }] }, 'steps[0].fields must be an array.'],
  ['show as an object', { id: 'a', title: 'A', submit: { label: 'Go' }, fields: [{ key: 'x', type: 'text', label: 'X', show: { field: 'y', eq: 1 } }] }, 'fields[0].show must be an array.'],
  ['a null condition', { id: 'a', title: 'A', submit: { label: 'Go' }, fields: [{ key: 'x', type: 'text', label: 'X', showAny: [null] }] }, 'fields[0].showAny[0] must be a condition object.'],
  ['routes as an object', { id: 'a', title: 'A', submit: { label: 'Go' }, steps: [{ id: 's', title: 'S', fields: [], routes: { to: null } }] }, 'steps[0].routes must be an array.'],
];

afterEach(() => vi.restoreAllMocks());

describe('malformed definitions', () => {
  it.each(malformed)('validateDefinition reports %s without throwing', (_, input, message) => {
    expect(validateDefinition(input)).toEqual([message]);
    expect(checkDefinition(input)).toEqual({ errors: [message], warnings: [] });
  });

  it.each(malformed)('the constructor throws a readable error for %s', (_, input, message) => {
    expect(() => new FormEngine(input as FormDefinition)).toThrow(new Error(message));
  });

  it('reports a missing submit action and a condition without field', () => {
    const input = { id: 'a', title: 'A', fields: [{ key: 'x', type: 'text', label: 'X', show: [{ eq: 'y' }] }] };

    expect(validateDefinition(input)).toEqual([
      'Form definition is missing the "submit" action.',
      'Field "x" has a show condition without "field"',
    ]);
  });

  it('accepts $schema in a typed definition', () => {
    const definition: FormDefinition = {
      $schema: 'https://formhaus.dev/schema/form-definition.json',
      id: 'a',
      title: 'A',
      submit: { label: 'Go' },
      fields: [{ key: 'x', type: 'text', label: 'X' }],
    };

    expect(validateDefinition(definition)).toEqual([]);
  });
});

describe('validateSubmission warnings', () => {
  it('does not log definition warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const definition: FormDefinition = {
      id: 'a',
      title: 'A',
      submit: { label: 'Go' },
      fields: [
        { key: 'x', type: 'text', label: 'X', show: [{ field: 'missing', eq: 'y' }] },
        { key: 'code', type: 'text', label: 'Code', validation: { validator: 'checkCode' } },
      ],
    };

    validateSubmission(definition, { code: 'a' });
    expect(warn).not.toHaveBeenCalled();

    new FormEngine(definition);
    expect(warn).toHaveBeenCalled();
  });
});
