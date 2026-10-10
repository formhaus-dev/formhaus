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
  cases.map((testCase) => [`${name}: ${testCase.name}`, definition, testCase] as const));
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

  it('treats non-object values and skippedSteps as empty', () => {
    const result = validateSubmission(skipFixture.definition, null, { skippedSteps: 'extras' as never });
    expect(result.values).toEqual({ tier: 'basic' });
    expect(Object.keys(result.errors)).toEqual(['name', 'phone', 'terms']);
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
