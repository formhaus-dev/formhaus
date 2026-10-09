import fc from 'fast-check';
import { it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { validateField, validateStep } from '../../src/validation';
import { commandArbitrary, initialValueArbitrary, modelDefinition } from './model.fixtures';
import { runModel } from './model.harness';

const numRuns = Number(process.env.FORMHAUS_MODEL_RUNS ?? 2000);

it('keeps engine invariants under random interleavings of edits, navigation and hooks', async () => {
  await fc.assert(fc.asyncProperty(
    initialValueArbitrary,
    fc.array(commandArbitrary, { minLength: 5, maxLength: 60, size: 'max' }),
    (initialValues, commands) => runModel(
      { FormEngine, validateField, validateStep },
      modelDefinition,
      initialValues,
      commands,
    ),
  ), { numRuns });
}, 120_000);
