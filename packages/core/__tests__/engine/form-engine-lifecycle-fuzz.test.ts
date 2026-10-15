import fc from 'fast-check';
import { it } from 'vitest';
import { commandArbitrary, fuzzCases, initialValues } from './lifecycle-fuzz.fixtures';
import { runFuzz } from './lifecycle-fuzz.harness';

const numRuns = Number(process.env.FORMHAUS_FUZZ_RUNS ?? 500);
const seed = Number(process.env.FORMHAUS_FUZZ_SEED ?? 20261015);

it.each(fuzzCases.map((fuzz) => [fuzz.definition.id, fuzz] as const))(
  'keeps %s consistent under random actions and late async results',
  async (_, fuzz) => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({ stepValidate: fc.boolean(), beforeSubmit: fc.boolean() }),
        initialValues(fuzz),
        fc.array(commandArbitrary(fuzz), { minLength: 5, maxLength: 80, size: 'max' }),
        (hooks, values, commands) => runFuzz(fuzz, hooks, values, commands),
      ),
      { numRuns, seed },
    );
  },
  600_000,
);
