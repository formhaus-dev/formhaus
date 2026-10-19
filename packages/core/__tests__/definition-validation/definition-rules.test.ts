import { describe, expect, it } from 'vitest';
import { checkDefinition } from '../../src';
import type { FormDefinition, FormField, FormStep } from '../../src/types';

const form = (fields: FormField[]): FormDefinition => ({ id: 'f', title: 'F', submit: { label: 'Submit' }, fields });
const steps = (list: FormStep[]): FormDefinition => ({ id: 'f', title: 'F', submit: { label: 'Submit' }, steps: list });
const field = (key: string, extra: Partial<FormField> = {}): FormField => ({ key, type: 'text', label: key, ...extra });
const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

describe('condition rules', () => {
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
      field('a', { type: 'stars' }),
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
          '/fields/0/type: "stars" is not a built-in field type. Name custom types with a dash or colon, like "x-rating", so a future built-in type cannot take the name.',
        hint: 'Name custom types with a dash or colon, like "x-rating", so a future built-in type cannot take the name.',
      },
      expect.objectContaining({ code: 'unknown-field-type', path: '/fields/4/type' }),
    ]);
  });

  it('checks validator names only when validators are given', () => {
    const definition = form([field('a', { validation: { validator: 'luhn' } })]);
    expect(checkDefinition(definition)).toEqual([]);
    expect(checkDefinition(definition, { validators: {} }).map((issue) => issue.code)).toEqual(['unknown-validator']);
    expect(checkDefinition(definition, { validators: { luhn: () => null } })).toEqual([]);
  });
});

describe('comparison rules', () => {
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
