import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FormDefinition } from '../../src';
import { localize, type Overlay } from '../../src/i18n';

export interface ConformanceCase {
  name: string;
  input: { values: Record<string, unknown>; skippedSteps: string[] };
  expected: { values: Record<string, unknown>; errors: Record<string, string> };
  canSubmit: boolean;
  serverValues?: Record<string, unknown>;
}

export interface ConformanceFixture {
  name: string;
  issues: { code: string; path: string }[];
  warnings?: { code: string; path: string }[];
  definition: FormDefinition;
  overlay?: Overlay;
  texts?: Record<string, string>;
  cases?: ConformanceCase[];
  recall?: RecallCase[];
}

export interface RecallCase {
  name: string;
  values: Record<string, unknown>;
  texts: { address: string; group?: string; item?: number; text: string }[];
}

const dir = join(__dirname, '../../fixtures/conformance');

export const corpus: ConformanceFixture[] = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')));

export const valid = corpus.filter(({ issues }) => !issues.length);

export const runtime = ({ definition, overlay }: ConformanceFixture) =>
  overlay ? localize(definition, { overlay }).definition : definition;

export const cases = valid.flatMap((fixture) =>
  (fixture.cases ?? []).map((testCase) => [`${fixture.name}: ${testCase.name}`, runtime(fixture), testCase] as const),
);

export const recalls = corpus.flatMap((fixture) =>
  (fixture.recall ?? []).map((testCase) => [`${fixture.name}: ${testCase.name}`, runtime(fixture), testCase] as const),
);
