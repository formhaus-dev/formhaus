import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkDefinition, FormDefinitionError, FormEngine, validateDefinition, type FormDefinition } from '../../src';
import { checkDefinition as serverCheck, validateSubmission } from '../../src/server';

const base = { id: 'a', title: 'A', submit: { label: 'Go' } };

const malformed: [string, unknown, string][] = [
  ['null', null, '/: the form definition must be an object.'],
  ['an array', [], '/: the form definition must be an object.'],
  ['fields as an object', { ...base, fields: {} }, '/fields: must be an array.'],
  ['a null field', { ...base, fields: [null] }, '/fields/0: must be a field object.'],
  ['steps as a string', { ...base, steps: 'one' }, '/steps: must be an array.'],
  ['a step without fields', { ...base, steps: [{ id: 's', title: 'S' }] }, '/steps/0: missing required property "fields".'],
  [
    'show as an object',
    { ...base, fields: [{ key: 'x', type: 'text', label: 'X', show: { field: 'y', eq: 1 } }] },
    '/fields/0/show: must be an array.',
  ],
  [
    'a null condition',
    { ...base, fields: [{ key: 'x', type: 'text', label: 'X', showAny: [null] }] },
    '/fields/0/showAny/0: must be a condition object.',
  ],
  [
    'routes as an object',
    { ...base, steps: [{ id: 's', title: 'S', fields: [], routes: { to: null } }] },
    '/steps/0/routes: must be an array.',
  ],
  ['a field without a key', { ...base, fields: [{ type: 'text', label: 'X' }] }, '/fields/0: missing required property "key".'],
  ['a numeric field key', { ...base, fields: [{ key: 1, type: 'text', label: 'X' }] }, '/fields/0/key: "key" must be a string.'],
  ['a field without a type', { ...base, fields: [{ key: 'x', label: 'X' }] }, '/fields/0: missing required property "type".'],
  ['a step without an id', { ...base, steps: [{ title: 'S', fields: [] }] }, '/steps/0: missing required property "id".'],
  [
    'a step with null fields',
    { ...base, steps: [{ id: 's', title: 'S', fields: null }] },
    '/steps/0/fields: must be an array. Use [] when there is nothing to list.',
  ],
  [
    'a route without to',
    { ...base, steps: [{ id: 's', title: 'S', fields: [], routes: [{ show: [] }] }] },
    '/steps/0/routes/0: missing required property "to".',
  ],
  [
    'a numeric route target',
    { ...base, steps: [{ id: 's', title: 'S', fields: [], routes: [{ to: 1 }] }] },
    '/steps/0/routes/0/to: "to" must be a step id or null.',
  ],
  [
    'a numeric option value',
    { ...base, fields: [{ key: 'x', type: 'select', label: 'X', options: [{ value: 1, label: 'A' }] }] },
    '/fields/0/options/0/value: "value" must be a string.',
  ],
  ['submit.disabled as an object', { ...base, submit: { label: 'Go', disabled: {} } }, '/submit/disabled: must be an array.'],
  [
    'a null option',
    { ...base, fields: [{ key: 'x', type: 'select', label: 'X', options: [null] }] },
    '/fields/0/options/0: must be an option object.',
  ],
  [
    'an option without value',
    { ...base, fields: [{ key: 'x', type: 'select', label: 'X', options: [{ label: 'A' }] }] },
    '/fields/0/options/0: missing required property "value".',
  ],
  [
    'optionsDependsOn as a string',
    { ...base, fields: [{ key: 'x', type: 'select', label: 'X', optionsFrom: 'p', optionsDependsOn: 'a' }] },
    '/fields/0/optionsDependsOn: must be an array of field keys.',
  ],
  [
    'a numeric optionsDependsOn key',
    { ...base, fields: [{ key: 'x', type: 'select', label: 'X', optionsFrom: 'p', optionsDependsOn: [5] }] },
    '/fields/0/optionsDependsOn: must be an array of field keys.',
  ],
  [
    'validation as a string',
    { ...base, fields: [{ key: 'x', type: 'text', label: 'X', validation: 'required' }] },
    '/fields/0/validation: must be an object of validation rules.',
  ],
  [
    'a numeric matchField',
    { ...base, fields: [{ key: 'x', type: 'text', label: 'X', validation: { matchField: 5 } }] },
    '/fields/0/validation/matchField: "matchField" must be a string.',
  ],
  [
    'a string max',
    { ...base, fields: [{ key: 'x', type: 'number', label: 'X', validation: { min: '10', max: '9' } }] },
    '/fields/0/validation/min: "min" must be a number.\n/fields/0/validation/max: "max" must be a number.',
  ],
  [
    'an object message',
    { ...base, fields: [{ key: 'x', type: 'text', label: 'X', validation: { minLength: 2, minLengthMessage: { text: 'Short' } } }] },
    '/fields/0/validation/minLengthMessage: "minLengthMessage" must be a string.',
  ],
  [
    'non-string messages',
    {
      ...base,
      fields: [
        {
          key: 'x',
          type: 'number',
          label: 'X',
          validation: { maxLengthMessage: 1, minMessage: [], maxMessage: true, patternMessage: null, matchFieldMessage: {} },
        },
      ],
    },
    ['maxLengthMessage', 'minMessage', 'maxMessage', 'patternMessage', 'matchFieldMessage']
      .map((key) => `/fields/0/validation/${key}: "${key}" must be a string.`)
      .join('\n'),
  ],
  [
    'an object required',
    { ...base, fields: [{ key: 'x', type: 'text', label: 'X', validation: { required: { text: 'Required' } } }] },
    '/fields/0/validation/required: "required" must be true, false or a message string.',
  ],
  [
    'a numeric required',
    { ...base, fields: [{ key: 'x', type: 'text', label: 'X', validation: { required: 1 } }] },
    '/fields/0/validation/required: "required" must be true, false or a message string.',
  ],
  [
    'in as a number',
    {
      ...base,
      fields: [
        { key: 'a', type: 'text', label: 'A' },
        { key: 'x', type: 'text', label: 'X', show: [{ field: 'a', in: 5 }] },
      ],
    },
    '/fields/1/show/0/in: "in" must be an array of strings or numbers.',
  ],
  [
    'notIn as a string',
    {
      ...base,
      fields: [
        { key: 'a', type: 'text', label: 'A' },
        { key: 'x', type: 'text', label: 'X', show: [{ field: 'a', notIn: 'abc' }] },
      ],
    },
    '/fields/1/show/0/notIn: "notIn" must be an array of strings or numbers.',
  ],
  [
    'eq as an object',
    {
      ...base,
      fields: [
        { key: 'a', type: 'text', label: 'A' },
        { key: 'x', type: 'text', label: 'X', show: [{ field: 'a', eq: {} }] },
      ],
    },
    '/fields/1/show/0/eq: "eq" must be a string, number or boolean.',
  ],
  [
    'a numeric condition field',
    { ...base, fields: [{ key: 'x', type: 'text', label: 'X', show: [{ field: 5, eq: 'a' }] }] },
    '/fields/0/show/0/field: "field" must be a string.',
  ],
];

afterEach(() => vi.restoreAllMocks());

describe('malformed definitions', () => {
  it.each(malformed)('checkDefinition reports %s without throwing', (_, input, message) => {
    expect(checkDefinition(input).map((issue) => issue.message)).toEqual(message.split('\n'));
    expect(serverCheck(input)).toEqual(checkDefinition(input));
    expect(validateDefinition(input)).toEqual(message.split('\n'));
  });

  it.each(malformed)('the constructor throws FormDefinitionError for %s', (_, input, message) => {
    let thrown: unknown;
    try {
      new FormEngine(input as FormDefinition);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(FormDefinitionError);
    expect((thrown as FormDefinitionError).issues.map((issue) => issue.message)).toEqual(message.split('\n'));
    expect((thrown as Error).message).toBe(`Invalid form definition:\n${message}`);
  });

  it('reports a missing submit action, id and condition field', () => {
    const input = { title: 'A', fields: [{ key: 'x', type: 'text', label: 'X', show: [{ eq: 'y' }] }] };
    expect(checkDefinition(input).map(({ code, severity, path }) => [code, severity, path])).toEqual([
      ['missing-property', 'error', ''],
      ['missing-property', 'error', ''],
      ['missing-property', 'error', '/fields/0/show/0'],
    ]);
  });

  it('warns about a missing title', () => {
    expect(checkDefinition({ id: 'a', submit: { label: 'Go' } })).toEqual([
      {
        code: 'missing-property',
        severity: 'warning',
        path: '',
        message: '/: missing required property "title". Add a title for host UI and editors.',
        hint: 'Add a title for host UI and editors.',
      },
    ]);
  });

  it('accepts null for optional lists', () => {
    const input = {
      ...base,
      fields: null,
      steps: [{ id: 's', title: 'S', show: null, routes: null, fields: [{ key: 'x', type: 'text', label: 'X', showAny: null }] }],
    };
    expect(checkDefinition(input)).toEqual([]);
    expect(() => new FormEngine(input as unknown as FormDefinition)).not.toThrow();
  });

  it('accepts $schema in a typed definition', () => {
    const definition: FormDefinition = {
      $schema: 'https://formhaus.dev/schema/form-definition.json',
      ...base,
      fields: [{ key: 'x', type: 'text', label: 'X' }],
    };
    expect(checkDefinition(definition)).toEqual([]);
  });
});

describe('validateSubmission definition errors', () => {
  it('throws FormDefinitionError for a definition with errors', () => {
    const definition = { ...base, fields: [{ key: 'x', type: 'text', label: 'X', validation: { pattern: '(' } }] } as FormDefinition;
    expect(() => validateSubmission(definition, { x: 5 })).toThrow(/validation\/pattern/);
  });
});

describe('validateSubmission warnings', () => {
  it('does not log definition warnings', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const definition: FormDefinition = {
      ...base,
      fields: [
        { key: 'x', type: 'txt', label: 'X' },
        { key: 'code', type: 'text', label: 'Code', validation: { validator: 'checkCode' } },
      ],
    };
    validateSubmission(definition, { code: 'a' });
    expect(warn).not.toHaveBeenCalled();
    new FormEngine(definition);
    expect(warn).toHaveBeenCalled();
  });
});
