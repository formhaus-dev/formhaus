import { describe, expect, it } from 'vitest';
import { checkDefinition } from '../../src';
import { slowPattern } from '../../src/definition-validation/slow-pattern';
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
      '/fields/1/show/0/equals: "equals" is not a condition operator. Use one of: "eq", "neq", "in", "notIn", "contains", "notContains", "notEmpty", "gt", "gte", "lt", ....',
    ]);
    expect(checkDefinition(form([field('a'), field('b', { show: [{ field: 'a', eg: 'x' } as never] })]))[0].hint).toBe('Use "eq".');
  });

  it('says that a negated condition on a list field always matches', () => {
    const issues = checkDefinition(
      form([field('tags', { type: 'multiselect', options }), field('b', { show: [{ field: 'tags', neq: 'a' }] })]),
    );
    expect(issues[0].message).toBe(
      '/fields/1/show/0/neq: "tags" holds a list of values, so "neq" always matches it. Use contains, notContains or notEmpty.',
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

  it('warns about overlapping repeats split by optional parts or groups', () => {
    const slow = [
      '^[0-9]+\\s?[0-9]+\\s?[0-9]+\\s?[0-9]+$',
      '^(\\d+)(\\d+)(\\d+)(\\d+)x',
      '^\\w+.?\\w+.?\\w+@',
      '^(?:\\d+)(?:\\d+)(?:\\d+)x',
      '^\\d+(?:\\.\\d+)?\\d+$',
      '^\\d+[a-z]*\\d+',
      '^\\d+\\d{0,3}\\d+',
    ];
    const fast = ['^\\d{5}(-\\d{4})?$', '^0?[0-9]+$', '^\\d+-?[a-z]+$', '^[a-z]+(?:\\.[0-9]+)?$'];
    const issues = checkDefinition(form([...slow, ...fast].map((pattern, index) => field(`p${index}`, { validation: { pattern } }))));
    expect(issues.map((issue) => `${issue.code} ${issue.path}`)).toEqual(
      slow.map((_, index) => `slow-pattern /fields/${index}/validation/pattern`),
    );
  });

  it('warns about a number with an optional decimal point, which backtracks quadratically on digits without the point', () => {
    expect(checkDefinition(form([field('a', { validation: { pattern: '^\\d+\\.?\\d*$' } })])).map((issue) => issue.code)).toEqual([
      'slow-pattern',
    ]);
  });

  it('warns about adjacent repeated parts that overlap', () => {
    const slow = ['^\\d*\\d*\\d*\\d*\\d*x$', 'a*a*b', '.*.*x', '\\d+\\w+', '[a-c]+[c-e]*', '(?:a|b)*a{2,}', 'x(?:\\s*\\s+)y'];
    const fast = [
      '^\\d+-\\d+$',
      '[a-z]+@[a-z]+',
      'a*b*',
      '\\d*\\D*',
      'a?a?',
      'a+(?=a)a+',
      '\\(a*\\)a*',
      '^\\+?\\d+$',
      '^\\d+(?:\\.\\d+)?$',
    ];
    const issues = checkDefinition(form([...slow, ...fast].map((pattern, index) => field(`p${index}`, { validation: { pattern } }))));
    expect(issues.map((issue) => issue.path)).toEqual(slow.map((_, index) => `/fields/${index}/validation/pattern`));
    expect(issues[0]).toMatchObject({
      code: 'slow-pattern',
      severity: 'warning',
      message:
        '/fields/0/validation/pattern: the pattern of "p0" repeats overlapping parts next to each other and can be very slow. Merge the repeated parts into one.',
    });
    expect(checkDefinition(form([field('a', { validation: { pattern: '(\\w+\\s?)+' } })]))[0].hint).toBe(
      'Remove the inner or outer quantifier.',
    );
  });

  it('does not warn about a repeated group that starts or ends with a character nothing else in it matches', () => {
    const slow = [
      '(a+\\.a+)+',
      '(\\.?[a-z]+\\.)+',
      '(.+\\.)+',
      '([a-z]+\\.|x)+',
      '(a+a)+',
      '(\\d+\\.+)+',
      '([a-z.]+\\.)+',
      '(a+\\1)+',
      '(-)(?:a*\\1*-)+$',
      '(?<s>-)(?:a*\\k<s>*-)+$',
      '(?<s>a)a*\\k<s>*$',
      '\\k<(a+)+>',
      '\\k<(a|a)+>',
      '(?<ä>a)a*\\k<ä>*$',
      '(?<$s>a)a*\\k<$s>*$',
    ];
    const fast = [
      '^(?<q>["\']).*\\k<q>$',
      '^(?<d>\\d)-\\k<d>$',
      '([\\w-]+\\.)+',
      '(?:,\\s*[a-z]+)*',
      '( [A-Za-z]+)*',
      '((a+)\\.)+',
      '([^,]+,)+',
      '(?:[a-z]+\\.){2,}',
    ];
    const issues = checkDefinition(form([...slow, ...fast].map((pattern, index) => field(`p${index}`, { validation: { pattern } }))));
    expect(issues.map((issue) => issue.path)).toEqual(slow.map((_, index) => `/fields/${index}/validation/pattern`));
  });
});

describe('slowPattern', () => {
  it('reads the text after \\k as pattern unless it is a group name', () => {
    expect(
      ['(?<s>a)\\k<(a+)+>', '(?<s>a)\\k<(a|a)+>', '(?<s>a)a*\\k<s>*$', '(?<s>a)a*\\k<\\u{73}>*$', '(?<s>a)a*\\k<\\u0073>*$'].map(
        (pattern) => slowPattern(pattern),
      ),
    ).toEqual(['nested', 'nested', 'adjacent', 'adjacent', 'adjacent']);
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

describe('contains rules', () => {
  const tags = field('tags', { type: 'multiselect', options });
  const latest = (fields: FormField[]): FormDefinition => ({ ...form(fields), formatVersion: '1.4' });
  const describeIssues = (definition: FormDefinition) =>
    checkDefinition(definition).map(({ code, path, message }) => ({ code, path, message }));

  it('accepts contains and notContains on a multiselect option', () => {
    expect(
      checkDefinition(
        latest([tags, field('b', { show: [{ field: 'tags', contains: 'a' }], showAny: [{ field: 'tags', notContains: 'b' }] })]),
      ),
    ).toEqual([]);
  });

  it('warns about contains on a field that does not hold a list', () => {
    expect(describeIssues(latest([field('a'), field('b', { show: [{ field: 'a', notContains: 'x' }] })]))).toEqual([
      {
        code: 'contains-not-list',
        path: '/fields/1/show/0/notContains',
        message:
          '/fields/1/show/0/notContains: "a" is a text field, so "notContains" always matches it. Use eq or in, or test a multiselect field.',
      },
    ]);
  });

  it('does not warn about contains on a custom type', () => {
    expect(checkDefinition(latest([field('a', { type: 'x-tags' }), field('b', { show: [{ field: 'a', contains: 'x' }] })]))).toEqual([]);
  });

  it('warns about an operand that is not an option', () => {
    expect(describeIssues(latest([tags, field('b', { show: [{ field: 'tags', contains: 'z' }] })]))).toEqual([
      {
        code: 'contains-not-in-options',
        path: '/fields/1/show/0/contains',
        message: '/fields/1/show/0/contains: "z" is not an option of "tags". Use one of: "a", "b".',
      },
    ]);
  });

  it('asks for format 1.4 when a condition uses contains', () => {
    const definition = steps([
      { id: 'one', title: 'One', fields: [tags], routes: [{ to: 'two', show: [{ field: 'tags', contains: 'a' }] }] },
      { id: 'two', title: 'Two', fields: [field('b')] },
    ]);
    expect(describeIssues({ ...definition, formatVersion: '1.3' })).toEqual([
      {
        code: 'outdated-format-version',
        path: '/formatVersion',
        message:
          '/formatVersion: /steps/0/routes/0/show/0 uses "contains", which needs format 1.4. Set "formatVersion": "1.4". Older versions of @formhaus/core reject this operator. Upgrade the server that runs validateSubmission() first.',
      },
    ]);
    expect(checkDefinition({ ...definition, formatVersion: '1.4' })).toEqual([]);
  });
});
