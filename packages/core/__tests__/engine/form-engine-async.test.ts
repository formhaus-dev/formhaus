import { describe, expect, it } from 'vitest';
import { FormEngine, type StepValidateFn } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { multiStepDefinition } from './form-engine-steps.fixtures';

describe('FormEngine async step validation', () => {
  it('clears validating state before notifying about async errors', async () => {
    const onStepValidate: StepValidateFn = async () => ({ name: 'Already taken' });
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    const seen: boolean[] = [];
    engine.subscribe(() => seen.push(engine.stepValidating));
    await engine.next();
    expect(seen.at(-1)).toBe(false);
  });

  it('returns false for single-step forms', async () => {
    const definition: FormDefinition = {
      id: 'single',
      title: 'Single',
      submit: { label: 'Submit' },
      fields: [{ key: 'name', type: 'text', label: 'Name' }],
    };
    await expect(new FormEngine(definition).next()).resolves.toBe(false);
  });
});
