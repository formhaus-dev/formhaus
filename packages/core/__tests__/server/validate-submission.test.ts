import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormField } from '../../src';
import { countReads } from './reads';

interface SubmissionCase {
  name: string;
  input: { values: unknown; skippedSteps: string[] };
  expected: { values: Record<string, unknown>; errors: Record<string, string> };
}

interface SubmissionFixture {
  name: string;
  definition: FormDefinition;
  cases: SubmissionCase[];
}

const fixturesDir = join(__dirname, '../../fixtures/submissions');
const iifePath = join(__dirname, '../../dist/server.iife.js');
const fixtures: SubmissionFixture[] = readdirSync(fixturesDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(fixturesDir, file), 'utf8')));
const cases = fixtures.flatMap(({ name, definition, cases }) =>
  cases.map((testCase) => [`${name}: ${testCase.name}`, definition, testCase] as const),
);
const skipFixture = fixtures.find(({ name }) => name === 'skip')!;

describe('validateSubmission fixtures', () => {
  it.each(cases)('%s', (_, definition, { input, expected }) => {
    expect(validateSubmission(definition, input.values, { skippedSteps: input.skippedSteps })).toEqual(expected);
  });
});

describe('validateSubmission', () => {
  it('does not mutate the input values', () => {
    const { input } = skipFixture.cases[0];
    const values = structuredClone(input.values);
    validateSubmission(skipFixture.definition, values, { skippedSteps: input.skippedSteps });
    expect(values).toEqual(input.values);
  });

  it('accepts loaded values for optionsFrom fields that also list static options', () => {
    const definition: FormDefinition = {
      id: 'remote',
      title: 'Remote',
      submit: { label: 'Send' },
      fields: [
        { key: 'city', type: 'select', label: 'City', optionsFrom: 'cities', options: [] },
        { key: 'tags', type: 'multiselect', label: 'Tags', optionsFrom: 'tags', options: [] },
      ],
    };
    expect(validateSubmission(definition, { city: 'paris', tags: ['a', 'b'] }).errors).toEqual({});
  });

  it('treats non-object values and skippedSteps as empty', () => {
    const result = validateSubmission(skipFixture.definition, null, { skippedSteps: 'extras' as never });
    expect(result.values).toEqual({});
    expect(Object.keys(result.errors)).toEqual(['name', 'phone', 'terms']);
  });

  it('treats a null number as blank', () => {
    const definition = (required: boolean): FormDefinition => ({
      id: 'blank',
      title: '',
      submit: { label: 'Send' },
      fields: [
        { key: 'age', type: 'number', label: 'Age', validation: { required } },
        { key: 'more', type: 'text', label: 'More', show: [{ field: 'age', notEmpty: true }] },
      ],
    });
    expect(validateSubmission(definition(false), { age: null, more: 'x' })).toEqual({ values: { age: null }, errors: {} });
    expect(validateSubmission(definition(true), { age: null }).errors).toEqual({ age: 'This field is required' });
  });
});

describe('validateSubmission with values shown by a skipped step', () => {
  const definition: FormDefinition = {
    id: 'restore',
    title: 'Restore',
    submit: { label: 'Send' },
    steps: [
      { id: 's1', title: 'One', skip: { label: 'Skip' }, fields: [{ key: 'a', type: 'text', label: 'A' }] },
      {
        id: 's2',
        title: 'Two',
        fields: [
          { key: 'c', type: 'x-rating', label: 'C', show: [{ field: 'a', neq: 'x' }] },
          { key: 'f', type: 'file', label: 'F', show: [{ field: 'a', neq: 'x' }] },
          {
            key: 'g',
            type: 'group',
            label: 'G',
            fields: [{ key: 'r', type: 'x-rating', label: 'R', show: [{ field: 'a', neq: 'x' }] }],
          },
        ],
      },
    ],
  };
  const skip = { skippedSteps: ['s1'] };

  it('checks submitted top-level values against the reset values of the skipped step', () => {
    const result = validateSubmission(definition, { a: 'x', c: { evil: 1 }, f: { not: 'a string' } }, skip);
    expect(result.errors).toEqual({ c: 'Invalid value', f: 'Must be a file reference' });
  });

  it('checks submitted item values against the reset values of the skipped step', () => {
    expect(validateSubmission(definition, { a: 'x', g: [{ r: { evil: 2 } }] }, skip).errors).toEqual({ 'g.0.r': 'Invalid value' });
  });

  it('rejects an oversized custom type string', () => {
    const long = 'z'.repeat(20000);
    for (const a of ['x', 'y'])
      expect(validateSubmission(definition, { a, c: long, g: [{ r: long }] }, skip).errors).toEqual({
        c: 'Maximum length is 10000',
        'g.0.r': 'Maximum length is 10000',
      });
  });

  it('keeps a legitimate submission', () => {
    const values = { a: 'y', c: 4, f: 'file-1', g: [{ r: 3 }] };
    expect(validateSubmission(definition, values)).toEqual({ values, errors: {} });
    const { a: _, ...rest } = values;
    expect(validateSubmission(definition, values, skip)).toEqual({ values: rest, errors: {} });
  });
});

describe.skipIf(!existsSync(iifePath) && !process.env.CI)('server IIFE build', () => {
  it('runs every fixture without a console global', () => {
    const context: { Formhaus?: { validateSubmission: typeof validateSubmission } } = {};
    runInNewContext(readFileSync(iifePath, 'utf8'), context);
    for (const [name, definition, { input, expected }] of cases) {
      const result = context.Formhaus!.validateSubmission(definition, input.values, { skippedSteps: input.skippedSteps });
      expect(JSON.parse(JSON.stringify(result)), name).toEqual(expected);
    }
  });
});

describe('validateSubmission with an oversized multiselect value', () => {
  const tags = (extra: Partial<FormField> = {}): FormField => ({
    key: 'tags',
    type: 'multiselect',
    label: 'Tags',
    options: [
      { value: 'a', label: 'A' },
      { value: 'x', label: 'X' },
    ],
    ...extra,
  });
  const definition = (field: FormField): FormDefinition => ({
    id: 'tags',
    title: '',
    submit: { label: 'Send' },
    fields: [
      field,
      {
        key: 'picked',
        type: 'text',
        label: 'Picked',
        show: [{ field: 'tags', contains: 'x' }],
      },
      ...Array.from(
        { length: 300 },
        (_, index): FormField => ({
          key: `other${index}`,
          type: 'text',
          label: 'Other',
          show: [{ field: 'tags', notContains: `q${index}` }],
        }),
      ),
    ],
  });

  it('evaluates conditions as if the value were blank', () => {
    const list = countReads(Array.from({ length: 1001 }, () => 'x'));
    const values = { tags: list.list, picked: 'smuggled', other0: 'kept' };
    const result = validateSubmission(definition(tags()), values);
    expect(list.reads()).toBe(0);
    expect(result.errors).toEqual({ tags: 'Select one of the available options' });
    expect(result.values).toEqual({ other0: 'kept' });
  });

  it('caps a value with remote options at 1000 items', () => {
    const remote = tags({ optionsFrom: 'tags', options: [] });
    const fits = validateSubmission(definition(remote), {
      tags: Array.from({ length: 1000 }, (_, index) => `x${index}`),
      picked: 'p',
    });
    expect(fits.errors).toEqual({});
    const over = validateSubmission(definition(remote), {
      tags: ['x', ...Array.from({ length: 1000 }, (_, index) => `y${index}`)],
      picked: 'p',
    });
    expect(over.errors).toEqual({ tags: 'Select one of the available options' });
    expect(over.values.picked).toBeUndefined();
  });

  it('treats a string as blank', () => {
    expect(validateSubmission(definition(tags()), { tags: 'x', picked: 'p' })).toEqual({
      values: {},
      errors: { tags: 'Must be a list of available options' },
    });
  });
});
