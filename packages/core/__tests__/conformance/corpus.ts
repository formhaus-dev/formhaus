import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FormDefinition } from '../../src';

export interface ConformanceCase {
  name: string;
  input: { values: Record<string, unknown>; skippedSteps: string[] };
  expected: { values: Record<string, unknown>; errors: Record<string, string> };
  canSubmit: boolean;
}

export interface ConformanceFixture {
  name: string;
  issues: { code: string; path: string }[];
  definition: FormDefinition;
  cases: ConformanceCase[];
}

const dir = join(__dirname, '../../fixtures/conformance');

export const corpus: ConformanceFixture[] = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')));

export const valid = corpus.filter(({ issues }) => !issues.length);

export const cases = valid.flatMap((fixture) => fixture.cases.map((testCase) => [`${fixture.name}: ${testCase.name}`, fixture.definition, testCase] as const));
