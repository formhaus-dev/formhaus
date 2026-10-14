import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { simulatePathTool } from '../src/simulate';

interface Fixture {
  name: string;
  issues: unknown[];
  definition: unknown;
  overlay?: unknown;
  cases: { name: string; input: { values: Record<string, unknown> }; expected: { values: Record<string, unknown>; errors: Record<string, string> }; canSubmit: boolean }[];
}

const dir = join(__dirname, '../../core/fixtures/conformance');
const corpus: Fixture[] = readdirSync(dir).filter((file) => file.endsWith('.json')).map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')));
const cases = corpus.filter(({ issues }) => !issues.length).flatMap(({ name, definition, overlay, cases }) => cases.map((item) => [`${name}: ${item.name}`, definition, overlay, item] as const));

describe('conformance corpus in simulate_path', () => {
  it.each(corpus.filter(({ issues }) => issues.length).map(({ name, definition }) => [name, definition] as const))('%s: rejected', async (_, definition) => {
    expect((await simulatePathTool({ definition })).ok).toBe(false);
  });

  it.each(cases)('%s', async (_, definition, overlay, { input, expected, canSubmit }) => {
    const result = await simulatePathTool({ definition, answers: input.values, overlay });
    expect(result.ok).toBe(true);
    expect(result.wouldSubmit).toBe(canSubmit);
    if (!result.multiStep) expect(result.errors).toEqual(expected.errors);
    if (canSubmit) expect(result.submitValues).toEqual(expected.values);
  });
});
