import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createActivePath } from '../../src/engine/step-routes';
import { indexDefinition } from '../../src/engine/visibility-index';
import type { FormDefinition } from '../../src';
import { pathDefinitions, valuesArbitrary, writeArbitrary } from './path-patch.fixtures';

type Values = Record<string, unknown>;

const numRuns = Number(process.env.FORMHAUS_FUZZ_RUNS ?? 300);

function fresh(definition: FormDefinition, values: Values) {
  const path = createActivePath(definition, indexDefinition(definition));
  const copy = { ...values };
  return { steps: path.steps(copy).map((step) => step.id), values: { ...path.values(copy) } };
}

describe('path patch', () => {
  it('matches a full walk after every patched write', () => {
    let patched = 0;
    fc.assert(
      fc.property(
        pathDefinitions(false),
        valuesArbitrary,
        fc.array(writeArbitrary, { minLength: 1, maxLength: 8 }),
        (definition, start, sequence) => {
          const path = createActivePath(definition, indexDefinition(definition));
          const values: Values = { ...start };
          path.values(values);
          for (const [key, value] of sequence) {
            if (value === undefined) delete values[key];
            else values[key] = value;
            if (!path.patch(values, key)) {
              path.invalidate();
              continue;
            }
            patched++;
            const expected = fresh(definition, values);
            expect(path.steps(values).map((step) => step.id)).toEqual(expected.steps);
            expect({ ...path.values(values) }).toEqual(expected.values);
            expect(Object.keys(path.values(values))).toEqual(Object.keys(expected.values));
          }
        },
      ),
      { numRuns },
    );
    expect(patched).toBeGreaterThan(numRuns);
  });
});
