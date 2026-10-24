import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkDefinition, FormDefinitionError, FormEngine, type FormDefinition, type FormField } from '../../src';
import { validateSubmission } from '../../src/server';
import { quadraticLimit } from '../../src/server/slow-patterns';
import corpus from './real-world-patterns.json';

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

  it('refuses every slow pattern that is not quadratic', () => {
    const long = `^(?:${'a'.repeat(995)})$`;
    const definition = form('^\\d+$', '(a|aa)+', '^\\d*\\d*\\d*$', '^[a-z]+$', '\\d+\\.?\\d*$', long, long.slice(1), '^\\d+\\.?\\d*$|^x$');
    const slow = checkDefinition(definition).filter(({ code }) => code === 'slow-pattern');
    expect(slow.map(({ path }) => path)).toEqual([1, 2, 4, 5, 7].map((index) => `/fields/${index}/validation/pattern`));
    expect(refused(definition).map(({ path }) => path)).toEqual(slow.map(({ path }) => path));
  });

  it('runs an anchored pattern with one pair of overlapping repeats', () => {
    const quadratic = [
      '^\\d+\\.?\\d*$',
      '^\\d*\\.?\\d*$',
      '^-?\\d+\\.?\\d*$',
      '^[0-9]+[.,]?[0-9]*$',
      '^[0-9]+\\s?[0-9]+$',
      '^\\+?\\d+[\\d\\s-]*$',
      '^[a-zA-Z]+[a-zA-Z ]*$',
      '^[A-Za-z]+\\s?[A-Za-z]*$',
      '^\\d+,?\\d*$',
      '^(\\d+)\\.?(\\d*)$',
    ];
    const definition = form(...quadratic);
    expect(checkDefinition(definition).map(({ code }) => code)).toEqual(quadratic.map(() => 'slow-pattern'));
    expect(refused(definition)).toEqual([]);
    const values = ['12.5', '.5', '-3.25', '1,5', '555 0100', '+1 555-0100', 'Ada Lovelace', 'Ada Lovelace', '1,5', '3.25'];
    const valid = Object.fromEntries(values.map((value, index) => [`p${index}`, value]));
    expect(validateSubmission(definition, valid).errors).toEqual({});
    expect(Object.keys(validateSubmission(form(quadratic[0]), { p0: '1.2.3' }).errors)).toEqual(['p0']);
  });

  it('gives a value over 1000 characters the pattern error of a quadratic pattern without matching it', () => {
    const definition = form('^\\d+\\.?\\d*$', '^\\d+(\\.\\d*)?$');
    const long = '1'.repeat(1001);
    const test = tests();
    expect(validateSubmission(definition, { p0: long, p1: long }).errors).toEqual({ p0: 'Invalid format' });
    expect(test.mock.calls.filter(([input]) => input === long)).toHaveLength(1);
    expect(validateSubmission(definition, { p0: long.slice(1) }).errors).toEqual({});
    const engine = new FormEngine(definition, { p0: long }, { onWarning: () => {} });
    expect(engine.validate()).toEqual({});
  });

  it('refuses overlapping repeats that a lookaround, an alternation, an optional group or a backreference can multiply', () => {
    const value = `${'1'.repeat(40)}x`;
    const test = tests();
    const patterns = [
      '^\\d+-?\\d+-?\\d+$',
      '^[ab]+[bc]+[ac]+$',
      '^(ab)+(ab)+(ab)+$',
      '^\\d+\\.?\\d*(a+)+$',
      '^\\d+(?:a|\\d*)\\d*$',
      '^\\d+(?:-?\\d+)?\\d*$',
      '^(?:\\d+\\d+)?\\d+$',
      '^\\d+\\d+x\\d+\\d+$',
      '^\\d*(?=\\d+\\d+$)',
      '^\\d+\\d*1\\d*$',
      '^\\d+\\d*\\d{1,999}\\d*$',
      '^\\d+\\d?\\d?\\d*$',
      '^\\d+\\d{0,999}\\d*$',
      '^(\\d)\\d*\\1*$',
      '^\\d+\\B\\d+\\B\\d+\\d+$',
      '^\\d+\\B\\d+\\d+$',
      '^\\d{1,1000}\\d{1,1000}\\d+\\d+$',
      '^\\d{1,1000}\\d+\\d+$',
      '^[^\\x00-\\x2f]+[^\\x30-\\x7f]+[^\\x00-\\x2f]+[^\\x00-\\x2f]+$',
    ];
    const issues = refused(form(...patterns), Object.fromEntries(patterns.map((_, index) => [`p${index}`, value])));
    expect(test.mock.calls.some(([input]) => input === value)).toBe(false);
    expect(issues.map(({ path }) => path)).toEqual(patterns.map((_, index) => `/fields/${index}/validation/pattern`));
  });

  it('refuses a pattern outside the grammar it runs quadratic patterns for', () => {
    const patterns = [
      '^\\w+.?\\w+@\\w+\\.\\w+$',
      '^\\d+\\D?\\d*$',
      '^[^a-z]+\\.?[^a-z]*$',
      '^\\d+\\x2e?\\d*$',
      '^\\d+é?\\d*$',
      '^\\d+\\.{0,1}\\d*$',
      '^\\d+?\\.?\\d*$',
      '^(\\d+\\.?\\d*)$|^$',
      '^(?:x)?\\d+\\d*$',
      '^((\\d+))\\.?\\d*$',
      '^\\d+\\.?\\d*[\\b]?$',
    ];
    const definition = form(...patterns);
    expect(checkDefinition(definition).map(({ code }) => code)).toEqual(patterns.map(() => 'slow-pattern'));
    expect(refused(definition).map(({ path }) => path)).toEqual(patterns.map((_, index) => `/fields/${index}/validation/pattern`));
  });

  it('refuses overlapping repeats split by a modifier group', () => {
    for (const pattern of ['^\\d+(?i:)\\d+(?i:)\\d+\\d+$', '^\\d+(?i:)\\d+\\d+$'])
      expect(() => validateSubmission(form(pattern), {})).toThrow(FormDefinitionError);
  });

  it('gives no pattern of a refused definition a value to match', () => {
    expect(quadraticLimit('^\\d*\\d*\\d*$')).toBe(0);
    expect(quadraticLimit('^\\d+\\.?\\d*$')).toBe(1000);
    expect(quadraticLimit('^\\d+$')).toBeUndefined();
  });

  it('classifies a corpus of real-world patterns', () => {
    const verdict = (pattern: string) => {
      const definition = form(pattern);
      if (!checkDefinition(definition).length) return 'runs';
      return refused(definition).length ? 'refused' : 'quadratic';
    };
    expect(corpus.map(({ pattern }) => ({ pattern, server: verdict(pattern) }))).toEqual(
      corpus.map(({ pattern, server }) => ({ pattern, server })),
    );
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
