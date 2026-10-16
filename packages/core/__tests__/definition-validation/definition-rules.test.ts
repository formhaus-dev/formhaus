import { describe, expect, it } from 'vitest';
import { checkDefinition } from '../../src';
import type { FormDefinition, FormField, FormStep } from '../../src/types';

const form = (fields: FormField[], extra: Partial<FormDefinition> = {}): FormDefinition => ({
  id: 'f',
  title: 'F',
  submit: { label: 'Submit' },
  fields,
  ...extra,
});
const steps = (list: FormStep[]): FormDefinition => ({ id: 'f', title: 'F', submit: { label: 'Submit' }, steps: list });
const field = (key: string, extra: Partial<FormField> = {}): FormField => ({ key, type: 'text', label: key, ...extra });
const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];
const codes = (definition: unknown) => checkDefinition(definition).map(({ code, severity, path }) => `${severity} ${code} ${path}`);

describe('condition rules', () => {
  it('rejects a condition without an operator or with two', () => {
    expect(codes(form([field('a'), field('b', { show: [{ field: 'a' }] })]))).toEqual(['error condition-operator-count /fields/1/show/0']);
    expect(codes(form([field('a'), field('b', { show: [{ field: 'a', eq: 'x', notEmpty: true }] })]))).toEqual([
      'error condition-operator-count /fields/1/show/0',
    ]);
  });

  it('rejects an unknown operator and suggests a known one', () => {
    const issues = checkDefinition(form([field('a'), field('b', { show: [{ field: 'a', equals: 'x' } as never] })]));
    expect(issues.map((issue) => issue.message)).toEqual([
      '/fields/1/show/0/equals: "equals" is not a condition operator. Use one of: "eq", "neq", "in", "notIn", "notEmpty", "gt", "gte", "lt", "lte".',
    ]);
    expect(checkDefinition(form([field('a'), field('b', { show: [{ field: 'a', eg: 'x' } as never] })]))[0].hint).toBe('Use "eq".');
  });

  it('says that a negated condition on a list field always matches', () => {
    const issues = checkDefinition(
      form([field('tags', { type: 'multiselect', options }), field('b', { show: [{ field: 'tags', neq: 'a' }] })]),
    );
    expect(issues[0].message).toBe(
      '/fields/1/show/0/neq: "tags" holds a list of values, so "neq" always matches it. Use notEmpty, or a select or radio field.',
    );
  });

  it('escapes the operator key in the path and does not suggest the owner key', () => {
    const issues = checkDefinition(
      form([field('a'), field('b', { show: [{ field: 'a', 'x/y~z': 1 } as never] }), field('c', { show: [{ field: 'zzz', eq: 'q' }] })]),
    );
    expect(issues.map((issue) => issue.path)).toEqual(['/fields/1/show/0/x~1y~0z', '/fields/2/show/0/field']);
    expect(issues[1].hint).toBe('Use one of: "a", "b".');
  });

  it('skips option checks when options load from a provider', () => {
    const city = field('city', { type: 'select', optionsFrom: 'cities', options, defaultValue: 'paris' });
    expect(checkDefinition(form([city, field('b', { show: [{ field: 'city', eq: 'rome' }] })]))).toEqual([]);
  });

  it('checks conditions on actions', () => {
    expect(codes(form([field('a')], { submit: { label: 'Go', disabled: [{ field: 'nope', eq: 'x' }] } }))).toEqual([
      'error unknown-field /submit/disabled/0/field',
    ]);
  });

  it('warns when a condition value can never match the field', () => {
    const fields = [
      field('choice', { type: 'select', options }),
      field('count', { type: 'number' }),
      field('agree', { type: 'checkbox' }),
      field('tags', { type: 'multiselect', options }),
      field('x', {
        showAny: [
          { field: 'choice', eq: 1 },
          { field: 'choice', in: ['a', 'c'] },
          { field: 'count', eq: '5' },
          { field: 'agree', eq: 'true' },
          { field: 'tags', in: ['a'] },
          { field: 'tags', notEmpty: true },
          { field: 'choice', neq: 'b' },
        ],
      }),
    ];
    expect(codes(form(fields))).toEqual([
      'warning condition-value-mismatch /fields/4/showAny/0/eq',
      'warning condition-value-mismatch /fields/4/showAny/1/in',
      'warning condition-value-mismatch /fields/4/showAny/2/eq',
      'warning condition-value-mismatch /fields/4/showAny/3/eq',
      'warning condition-value-mismatch /fields/4/showAny/4/in',
    ]);
  });

  it('reports a route typo as an unknown field and a later field as a forward reference', () => {
    const definition = steps([
      {
        id: 'a',
        title: 'A',
        fields: [field('kind')],
        routes: [
          { to: 'c', show: [{ field: 'knd', eq: 'x' }] },
          { to: 'c', show: [{ field: 'later', eq: 'x' }] },
        ],
      },
      { id: 'b', title: 'B', fields: [field('later')] },
      { id: 'c', title: 'C', fields: [] },
    ]);
    expect(checkDefinition(definition).map((issue) => issue.message)).toEqual([
      '/steps/0/routes/0/show/0/field: "knd" is not a field key. Use "kind".',
      '/steps/0/routes/1/show/0/field: "later" belongs to a later step. Route conditions can use fields of this or an earlier step.',
    ]);
  });
});

describe('field rules', () => {
  it('warns about a field type that looks like a typo, not about custom types', () => {
    expect(checkDefinition(form([field('a', { type: 'txt' }), field('b', { type: 'x-rating' })])).map((issue) => issue.message)).toEqual([
      '/fields/0/type: "txt" is not a built-in field type. Use "text", or register a component for "txt".',
    ]);
  });

  it('warns about a custom type name without a dash or colon', () => {
    const definition = form([
      field('a', { type: 'rating' }),
      field('b', { type: 'x-rating' }),
      field('c', { type: 'acme:rating' }),
      field('d', { type: 'datetime' }),
      field('e', { type: 'emial' }),
    ]);
    expect(checkDefinition(definition)).toEqual([
      {
        code: 'custom-type-name',
        severity: 'warning',
        path: '/fields/0/type',
        message:
          '/fields/0/type: "rating" is not a built-in field type. Name custom types with a dash or colon, like "x-rating", so a future built-in type cannot take the name.',
        hint: 'Name custom types with a dash or colon, like "x-rating", so a future built-in type cannot take the name.',
      },
      expect.objectContaining({ code: 'unknown-field-type', path: '/fields/4/type' }),
    ]);
  });

  it('checks custom type names inside sections, groups and steps', () => {
    const definition = {
      id: 'f',
      title: 'F',
      formatVersion: '1.1',
      submit: { label: 'Send' },
      steps: [
        {
          id: 's',
          title: 'S',
          fields: [
            { key: 'sec', type: 'section', title: 'Sec', fields: [field('a', { type: 'stars' })] },
            { key: 'list', type: 'group', label: 'List', fields: [field('b', { type: 'signature' }), field('c', { type: 'x-sign' })] },
          ],
        },
      ],
    } as unknown as FormDefinition;
    expect(codes(definition)).toEqual([
      'warning custom-type-name /steps/0/fields/0/fields/0/type',
      'warning custom-type-name /steps/0/fields/1/fields/0/type',
    ]);
  });

  it('warns about a choice field without options', () => {
    expect(codes(form([field('a', { type: 'select' }), field('b', { type: 'radio', optionsFrom: 'cities' })]))).toEqual([
      'warning missing-options /fields/0/options',
    ]);
  });

  it('warns about a default value that is not an option', () => {
    expect(
      codes(
        form([
          field('a', { type: 'select', options, defaultValue: 'c' }),
          field('b', { type: 'multiselect', options, defaultValue: ['a', 'z'] }),
        ]),
      ),
    ).toEqual(['warning default-not-in-options /fields/0/defaultValue', 'warning default-not-in-options /fields/1/defaultValue']);
  });

  it('rejects impossible ranges', () => {
    expect(
      codes(
        form([field('a', { validation: { minLength: 5, maxLength: 3 } }), field('b', { type: 'number', validation: { min: 9, max: 1 } })]),
      ),
    ).toEqual(['error invalid-range /fields/0/validation/minLength', 'error invalid-range /fields/1/validation/min']);
  });

  it('warns about rules that do not apply to the field type', () => {
    expect(
      codes(
        form([
          field('a', { validation: { min: 1 } }),
          field('b', { type: 'number', validation: { maxLength: 3 } }),
          field('c', { type: 'x-slider', validation: { min: 1 } }),
        ]),
      ),
    ).toEqual(['warning rule-not-applicable /fields/0/validation/min', 'warning rule-not-applicable /fields/1/validation/maxLength']);
  });

  it('rejects matchField and warns about optionsDependsOn on unknown keys', () => {
    expect(
      codes(
        form([
          field('a', { validation: { matchField: 'nope' } }),
          field('b', { type: 'select', optionsFrom: 'x', optionsDependsOn: ['a', 'zzz'] }),
        ]),
      ),
    ).toEqual(['error unknown-field /fields/0/validation/matchField', 'warning unknown-field /fields/1/optionsDependsOn/1']);
  });

  it('checks validator names only when validators are given', () => {
    const definition = form([field('a', { validation: { validator: 'luhn' } })]);
    expect(checkDefinition(definition)).toEqual([]);
    expect(checkDefinition(definition, { validators: {} }).map((issue) => issue.code)).toEqual(['unknown-validator']);
    expect(checkDefinition(definition, { validators: { luhn: () => null } })).toEqual([]);
  });
});

describe('comparison rules', () => {
  it('accepts comparisons on numbers and numeric radio options', () => {
    const score = field('score', {
      type: 'radio',
      options: [
        { value: '0', label: '0' },
        { value: '10', label: '10' },
      ],
    });
    expect(
      checkDefinition(
        form([
          score,
          field('why', { show: [{ field: 'score', lte: 6 }] }),
          field('count', { type: 'number', show: [{ field: 'score', gt: 1 }] }),
        ]),
      ),
    ).toEqual([]);
  });

  it('rejects a non-number operand', () => {
    const fields = [field('count', { type: 'number' }), field('x', { show: [{ field: 'count', gte: '5' as never }] })];
    expect(checkDefinition(form(fields)).map((issue) => issue.message)).toEqual(['/fields/1/show/0/gte: "gte" must be a number.']);
  });

  it('warns about a comparison on a list or boolean field', () => {
    const fields = [field('agree', { type: 'checkbox' }), field('x', { show: [{ field: 'agree', gt: 0 }] })];
    expect(checkDefinition(form(fields)).map((issue) => issue.message)).toEqual([
      '/fields/1/show/0/gt: "agree" is a checkbox field, so "gt" never matches it. Compare a number, text, radio or select field.',
    ]);
  });
});
