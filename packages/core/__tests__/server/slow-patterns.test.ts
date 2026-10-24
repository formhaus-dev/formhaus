import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkDefinition, FormDefinitionError, FormEngine, type FormDefinition, type FormField } from '../../src';
import { validateSubmission } from '../../src/server';

const form = (...patterns: string[]): FormDefinition => ({
  id: 'slow',
  title: 'Slow',
  submit: { label: 'Send' },
  fields: patterns.map((pattern, index): FormField => ({ key: `p${index}`, type: 'text', label: `P${index}`, validation: { pattern } })),
});

function refused(definition: FormDefinition, values: Record<string, unknown> = {}) {
  try {
    validateSubmission(definition, values);
  } catch (error) {
    if (error instanceof FormDefinitionError) return error.issues;
    throw error;
  }
  return [];
}

const tests = () => vi.spyOn(RegExp.prototype, 'test');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('slow patterns on the server', () => {
  it('refuses a nested quantifier without matching the value', () => {
    const value = `${'a'.repeat(40)}!`;
    const test = tests();
    const issues = refused(form('^(a+)+$'), { p0: value });
    expect(test.mock.calls.some(([input]) => input === value)).toBe(false);
    expect(issues).toEqual([
      {
        code: 'slow-pattern',
        severity: 'error',
        path: '/fields/0/validation/pattern',
        message:
          '/fields/0/validation/pattern: the pattern of "p0" can take very long on some values, so the server does not run it. Rewrite it without nested or overlapping repeats, in 1000 characters or less.',
        hint: 'Rewrite it without nested or overlapping repeats, in 1000 characters or less.',
      },
    ]);
  });

  it('refuses every pattern that checkDefinition reports as slow', () => {
    const long = `^(?:${'a'.repeat(995)})$`;
    const definition = form('^\\d+$', '(a|aa)+', '^\\d*\\d*\\d*$', '^[a-z]+$', '^\\d+\\.?\\d*$', long, long.slice(1));
    const slow = checkDefinition(definition).filter(({ code }) => code === 'slow-pattern');
    expect(slow.map(({ path }) => path)).toEqual([1, 2, 4, 5].map((index) => `/fields/${index}/validation/pattern`));
    expect(refused(definition).map(({ path }) => path)).toEqual(slow.map(({ path }) => path));
  });

  it('refuses a slow pattern inside a group', () => {
    const definition: FormDefinition = {
      ...form(),
      formatVersion: '1.1',
      fields: [
        {
          key: 'people',
          type: 'group',
          label: 'People',
          fields: [{ key: 'name', type: 'text', label: 'Name', validation: { pattern: '^(\\w+\\s?)+$' } }],
        },
      ],
    };
    expect(refused(definition, { people: [{ name: `${'a'.repeat(40)}!` }] }).map(({ path }) => path)).toEqual([
      '/fields/0/fields/0/validation/pattern',
    ]);
  });

  it('runs repeated groups that start or end with a separator', () => {
    const definition = form('^[\\w.+-]+@([\\w-]+\\.)+[\\w-]{2,}$', '^[A-Za-z]+( [A-Za-z]+)*$', '^[a-z]+(?:,\\s*[a-z]+)*$');
    expect(checkDefinition(definition)).toEqual([]);
    const long = 'a'.repeat(4000);
    const { errors } = validateSubmission(definition, {
      p0: `${long}@${long}.x`,
      p1: `${'ab '.repeat(3000)}!`,
      p2: `${'ab,'.repeat(3000)}!`,
    });
    expect(Object.keys(errors)).toEqual(['p0', 'p1', 'p2']);
    expect(validateSubmission(definition, { p0: 'ada@mail.example.com', p1: 'Ada Lovelace', p2: 'a, b,c' }).errors).toEqual({});
  });

  it('refuses a repeated group with a backreference to its separator', () => {
    const value = `${'-'.repeat(40)}!`;
    const test = tests();
    const issues = refused(form('(-)(?:a*\\1*-)+$', '(?<s>-)(?:a*\\k<s>*-)+$', '(?<s>a)a*\\k<s>*$'), { p0: value, p1: value, p2: value });
    expect(test.mock.calls.some(([input]) => input === value)).toBe(false);
    expect(issues.map(({ path }) => path)).toEqual([0, 1, 2].map((index) => `/fields/${index}/validation/pattern`));
  });

  it('does not cache a pattern over 1000 characters', () => {
    const short = form('^[a-z]+(?:/\\s*[a-z]+)*$');
    const test = tests();
    validateSubmission(short, {});
    const first = test.mock.calls.length;
    const long = `^(?:${'a'.repeat(1000)})$`;
    for (let index = 0; index < 300; index++) expect(refused(form(`${long}${index}`)).map(({ code }) => code)).toEqual(['slow-pattern']);
    test.mockClear();
    validateSubmission(short, {});
    expect(test.mock.calls.length).toBeLessThan(first);
  });

  it('checks a pattern once', () => {
    const definition = form('^[a-z]+(?:;\\s*[a-z]+)*$');
    const test = tests();
    validateSubmission(definition, {});
    const first = test.mock.calls.length;
    test.mockClear();
    validateSubmission(definition, {});
    expect(test.mock.calls.length).toBeLessThan(first);
    expect(() => validateSubmission(form('^(a+)+$'), {})).toThrow(FormDefinitionError);
  });

  it('checks a pattern changed in place after an earlier call', () => {
    const definition = form('^[a-z]+$');
    expect(validateSubmission(definition, { p0: 'abc' }).errors).toEqual({});
    definition.fields![0].validation = { pattern: '^(\\w+\\s?)+$' };
    const value = `${'a'.repeat(40)}!`;
    const test = tests();
    expect(refused(definition, { p0: value }).map(({ code }) => code)).toEqual(['slow-pattern']);
    expect(test.mock.calls.some(([input]) => input === value)).toBe(false);
  });

  it('keeps slow patterns a warning for the engine', () => {
    const engine = new FormEngine(form('^(a+)+$'), {}, { onWarning: () => {} });
    engine.setValue('p0', 'aaa');
    expect(engine.validate()).toEqual({});
  });
});
