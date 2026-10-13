import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { simulatePathTool } from '../src/simulate';

interface Fixture {
  name: string;
  issues: unknown[];
  definition: unknown;
  cases: { name: string; input: { values: Record<string, unknown> }; expected: { values: Record<string, unknown> }; canSubmit: boolean }[];
}

const dir = join(__dirname, '../../core/fixtures/conformance');
const corpus: Fixture[] = readdirSync(dir).filter((file) => file.endsWith('.json')).map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')));
const cases = corpus.filter(({ issues }) => !issues.length).flatMap(({ name, definition, cases }) => cases.map((item) => [`${name}: ${item.name}`, definition, item] as const));

describe('conformance corpus in simulate_path', () => {
  it.each(corpus.filter(({ issues }) => issues.length).map(({ name, definition }) => [name, definition] as const))('%s: rejected', async (_, definition) => {
    expect((await simulatePathTool({ definition })).ok).toBe(false);
  });

  it.each(cases)('%s', async (_, definition, { input, expected, canSubmit }) => {
    const result = await simulatePathTool({ definition, answers: input.values });
    expect(result.ok).toBe(true);
    expect(result.wouldSubmit).toBe(canSubmit);
    if (canSubmit) expect(result.submitValues).toEqual(expected.values);
  });
});
