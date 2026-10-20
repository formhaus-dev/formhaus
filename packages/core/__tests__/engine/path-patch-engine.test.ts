import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { checkDefinition } from '../../src/definition-validation';
import { pathDefinitions, valuesArbitrary, writeArbitrary } from './path-patch.fixtures';

const patching = vi.hoisted(() => ({ on: true }));
vi.mock('../../src/engine/path-patch', async (load) => {
  const actual = await load<typeof import('../../src/engine/path-patch')>();
  return {
    createPathPatch: (index: Parameters<typeof actual.createPathPatch>[0]) => {
      const patch = actual.createPathPatch(index);
      return (...args: Parameters<typeof patch>) => (patching.on ? patch(...args) : undefined);
    },
  };
});

const numRuns = Number(process.env.FORMHAUS_FUZZ_RUNS ?? 200);

const command = fc.oneof(
  { weight: 6, arbitrary: writeArbitrary.map(([key, value]) => ['set', key, value] as const) },
  { weight: 1, arbitrary: fc.tuple(fc.constant('next')) },
  { weight: 1, arbitrary: fc.tuple(fc.constant('back')) },
  { weight: 1, arbitrary: fc.tuple(fc.constant('validate')) },
  { weight: 1, arbitrary: fc.tuple(fc.constant('reset')) },
  { weight: 1, arbitrary: fc.tuple(fc.constant('replace')) },
);

function state(engine: FormEngine) {
  return {
    values: { ...engine.values },
    errors: { ...engine.errors },
    steps: engine.visibleSteps.map((step) => step.id),
    step: engine.currentStepIndex,
    submit: engine.getSubmitValues(),
    fields: engine.visibleFields.map((field) => field.key),
  };
}

async function run(engine: FormEngine, commands: readonly (readonly unknown[])[], definition: FormEngine['definition']) {
  const states = [];
  for (const [name, key, value] of commands) {
    if (name === 'set') engine.setValue(key as string, value);
    else if (name === 'next') await engine.next();
    else if (name === 'back') await engine.back();
    else if (name === 'validate') engine.validate();
    else if (name === 'reset') engine.reset();
    else engine.replaceDefinition(structuredClone(definition));
    states.push(state(engine));
  }
  return states;
}

describe('path patch in the engine', () => {
  it('leaves the engine state as a full walk would', async () => {
    let checked = 0;
    await fc.assert(
      fc.asyncProperty(
        pathDefinitions(true),
        valuesArbitrary,
        fc.array(command, { minLength: 1, maxLength: 20 }),
        async (definition, start, commands) => {
          if (checkDefinition(definition).some((issue) => issue.severity === 'error')) return;
          checked++;
          const quiet = { onWarning: () => {} };
          patching.on = true;
          const patched = await run(new FormEngine(structuredClone(definition), structuredClone(start), quiet), commands, definition);
          patching.on = false;
          const walked = await run(new FormEngine(structuredClone(definition), structuredClone(start), quiet), commands, definition);
          patching.on = true;
          expect(patched).toEqual(walked);
        },
      ),
      { numRuns },
    );
    expect(checked).toBeGreaterThan(numRuns / 4);
  });
});
