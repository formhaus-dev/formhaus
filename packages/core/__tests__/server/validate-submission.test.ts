import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { validateSubmission } from '../../src/server';
import type { FormDefinition } from '../../src';

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
        c: 'Must be at most 10000 characters',
        'g.0.r': 'Must be at most 10000 characters',
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

describe('validateSubmission with a skipped controlling step', () => {
  const definition: FormDefinition = {
    id: 'skip-rules',
    title: 'Skip rules',
    submit: { label: 'Send' },
    steps: [
      { id: 's1', title: 'One', skip: { label: 'Skip' }, fields: [{ key: 'a', type: 'text', label: 'A', defaultValue: 'show' }] },
      {
        id: 's2',
        title: 'Two',
        fields: [
          { key: 'n', type: 'number', label: 'N', show: [{ field: 'a', eq: 'show' }], validation: { min: 10 } },
          { key: 'code', type: 'text', label: 'Code', show: [{ field: 'a', eq: 'show' }], validation: { pattern: '^[A-Z]+$' } },
          {
            key: 'g',
            type: 'group',
            label: 'G',
            fields: [{ key: 'm', type: 'number', label: 'M', show: [{ field: 'a', eq: 'show' }], validation: { max: 5 } }],
          },
        ],
      },
    ],
  };

  it('runs the rules of fields that the skipped step defaults show', () => {
    const result = validateSubmission(definition, { a: 'show', n: 1, code: 'abc', g: [{ m: 9 }] }, { skippedSteps: ['s1'] });
    expect(result.values).toEqual({ n: 1, code: 'abc', g: [{ m: 9 }] });
    expect(Object.keys(result.errors).sort()).toEqual(['code', 'g.0.m', 'n']);
  });
});

describe('validateSubmission with missing keys', () => {
  it('does not fill a default for a key the payload leaves out', () => {
    const definition: FormDefinition = {
      id: 'consent',
      title: 'Consent',
      submit: { label: 'Send' },
      fields: [
        { key: 'ask', type: 'checkbox', label: 'Ask' },
        { key: 'consent', type: 'checkbox', label: 'Consent', defaultValue: true, show: [{ field: 'ask', eq: true }] },
        { key: 'note', type: 'text', label: 'Note', defaultValue: 'n', show: [{ field: 'consent', eq: true }] },
        {
          key: 'g',
          type: 'group',
          label: 'G',
          defaultItems: 1,
          fields: [{ key: 'k', type: 'text', label: 'K', defaultValue: 'd' }],
        },
      ],
    };
    expect(validateSubmission(definition, { ask: true })).toEqual({ values: { ask: true }, errors: {} });
    expect(validateSubmission(definition, { ask: true, g: [{}] })).toEqual({ values: { ask: true, g: [{}] }, errors: {} });
    expect(validateSubmission(definition, { ask: true, consent: true, note: 'x' })).toEqual({
      values: { ask: true, consent: true, note: 'x' },
      errors: {},
    });
  });
});

describe('validateSubmission with a group missing from the payload', () => {
  const definition: FormDefinition = {
    id: 'missing-group',
    title: 'Missing group',
    submit: { label: 'Send' },
    fields: [
      { key: 'on', type: 'checkbox', label: 'On' },
      {
        key: 'g',
        type: 'group',
        label: 'G',
        defaultItems: 1,
        show: [{ field: 'on', eq: true }],
        validation: { required: true },
        fields: [{ key: 'name', type: 'text', label: 'Name', defaultValue: 'Ada', validation: { required: true } }],
      },
    ],
  };

  it('does not create the default items of a conditional group', () => {
    const result = validateSubmission(definition, { on: true });
    expect(result.values).toEqual({ on: true });
    expect(Object.keys(result.errors)).toEqual(['g']);
  });

  it('does not create the default items of a group on a step shown by a skipped step', () => {
    const steps: FormDefinition = {
      id: 'skip-shown',
      title: 'Skip shown',
      submit: { label: 'Send' },
      steps: [
        { id: 's1', title: 'One', skip: { label: 'Skip' }, fields: [{ key: 'a', type: 'text', label: 'A', defaultValue: 'show' }] },
        {
          id: 's2',
          title: 'Two',
          show: [{ field: 'a', eq: 'show' }],
          fields: [
            { key: 'b', type: 'text', label: 'B', defaultValue: 'B' },
            { key: 'g', type: 'group', label: 'G', defaultItems: 1, fields: [{ key: 'k', type: 'text', label: 'K', defaultValue: 'd' }] },
          ],
        },
      ],
    };
    expect(validateSubmission(steps, {}, { skippedSteps: ['s1'] })).toEqual({ values: {}, errors: {} });
    expect(validateSubmission(steps, { a: 'show' })).toEqual({ values: { a: 'show' }, errors: {} });
  });
});

describe('validateSubmission with a field shown by the defaults of a skipped step', () => {
  const definition: FormDefinition = {
    id: 'skip-default',
    title: 'Skip default',
    submit: { label: 'Send' },
    steps: [
      { id: 's1', title: 'One', skip: { label: 'Skip' }, fields: [{ key: 'a', type: 'text', label: 'A', defaultValue: 'show' }] },
      {
        id: 's2',
        title: 'Two',
        fields: [
          { key: 'n', type: 'number', label: 'N', show: [{ field: 'a', eq: 'show' }], validation: { required: true, min: 10 } },
          { key: 'm', type: 'number', label: 'M', show: [{ field: 'a', eq: 'show' }] },
        ],
      },
    ],
  };
  const skip = { skippedSteps: ['s1'] };

  it('keeps an answer the browser sent without the skipped field', () => {
    expect(validateSubmission(definition, { n: 12, m: 3 }, skip)).toEqual({ values: { n: 12, m: 3 }, errors: {} });
  });

  it('runs the rules of that answer', () => {
    expect(validateSubmission(definition, { n: 2 }, skip).errors).toEqual({ n: 'Must be at least 10' });
    expect(Object.keys(validateSubmission(definition, {}, skip).errors)).toEqual(['n']);
  });
});
