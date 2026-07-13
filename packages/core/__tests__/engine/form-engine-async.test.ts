import { describe, expect, it, vi } from 'vitest';
import { FormEngine, type StepValidateFn } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { multiStepDefinition } from './form-engine-steps.fixtures';

describe('FormEngine async step validation', () => {
  it('works without an async validator', async () => {
    const engine = new FormEngine(multiStepDefinition, { name: 'John' });
    await expect(engine.nextStepAsync()).resolves.toBe(true);
    expect(engine.currentStep?.id).toBe('payment');
  });

  it('runs sync validation before the async validator', async () => {
    const onStepValidate = vi.fn().mockResolvedValue(null);
    const engine = new FormEngine(multiStepDefinition, {}, { onStepValidate });
    await expect(engine.nextStepAsync()).resolves.toBe(false);
    expect(engine.errors.name).toBe('This field is required');
    expect(onStepValidate).not.toHaveBeenCalled();
  });

  it('calls the async validator after sync validation passes', async () => {
    const onStepValidate = vi.fn().mockResolvedValue(null);
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    await engine.nextStepAsync();
    expect(onStepValidate).toHaveBeenCalledWith('personal', engine.values);
  });

  it('blocks transition when the async validator returns errors', async () => {
    const onStepValidate: StepValidateFn = async () => ({ name: 'Already taken' });
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    await expect(engine.nextStepAsync()).resolves.toBe(false);
    expect(engine.errors.name).toBe('Already taken');
    expect(engine.currentStep?.id).toBe('personal');
  });

  it('clears validating state before notifying about async errors', async () => {
    const onStepValidate: StepValidateFn = async () => ({ name: 'Already taken' });
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    const seen: boolean[] = [];
    engine.subscribe(() => seen.push(engine.stepValidating));
    await engine.nextStepAsync();
    expect(seen.at(-1)).toBe(false);
  });

  it.each([null, undefined])('allows transition for %s', async (validationResult) => {
    const onStepValidate: StepValidateFn = async () => validationResult;
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    await expect(engine.nextStepAsync()).resolves.toBe(true);
    expect(engine.currentStep?.id).toBe('payment');
  });

  it('publishes validating state during the request', async () => {
    let capturedValidating = false;
    const onStepValidate: StepValidateFn = async () => {
      capturedValidating = engine.stepValidating;
      return null;
    };
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    await engine.nextStepAsync();
    expect(capturedValidating).toBe(true);
    expect(engine.stepValidating).toBe(false);
  });

  it('rejects concurrent calls while validating', async () => {
    let resolve!: () => void;
    const onStepValidate: StepValidateFn = () => new Promise((done) => {
      resolve = () => done(null);
    });
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    const first = engine.nextStepAsync();
    await expect(engine.nextStepAsync()).resolves.toBe(false);
    resolve();
    await expect(first).resolves.toBe(true);
  });

  it('resets validating state when validation rejects', async () => {
    const onStepValidate: StepValidateFn = async () => {
      throw new Error('Network failure');
    };
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    await expect(engine.nextStepAsync()).rejects.toThrow('Network failure');
    expect(engine.stepValidating).toBe(false);
    expect(engine.currentStep?.id).toBe('personal');
  });

  it('discards a result after the current step changes', async () => {
    const resolvers: Array<(value: null) => void> = [];
    const onStepValidate: StepValidateFn = () => new Promise((done) => resolvers.push(done));
    const engine = new FormEngine(
      multiStepDefinition,
      { name: 'John', accountType: 'business' },
      { onStepValidate },
    );
    const first = engine.nextStepAsync();
    resolvers[0](null);
    await first;
    const second = engine.nextStepAsync();
    engine.prevStep();
    resolvers[1](null);
    await expect(second).resolves.toBe(false);
    expect(engine.currentStep?.id).toBe('personal');
  });

  it('discards a result after the form is reset', async () => {
    let resolve!: (value: null) => void;
    const onStepValidate: StepValidateFn = () => new Promise((done) => {
      resolve = done;
    });
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    const pending = engine.nextStepAsync();

    engine.reset({ name: 'Reset name' });
    resolve(null);

    await expect(pending).resolves.toBe(false);
    expect(engine.currentStep?.id).toBe('personal');
    expect(engine.stepValidating).toBe(false);
  });

  it('routes errors for hidden fields to top-level errors', async () => {
    const onStepValidate: StepValidateFn = async () => ({
      name: 'Server error',
      nonexistent: 'Unknown field error',
    });
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    await engine.nextStepAsync();
    expect(engine.errors.name).toBe('Server error');
    expect(engine.topLevelErrors).toContain('Unknown field error');
  });

  it('returns false for single-step forms', async () => {
    const definition: FormDefinition = {
      id: 'single',
      title: 'Single',
      submit: { label: 'Submit' },
      fields: [{ key: 'name', type: 'text', label: 'Name' }],
    };
    await expect(new FormEngine(definition).nextStepAsync()).resolves.toBe(false);
  });

  it('returns false on the last step', async () => {
    const onStepValidate: StepValidateFn = async () => null;
    const engine = new FormEngine(multiStepDefinition, { name: 'John' }, { onStepValidate });
    await engine.nextStepAsync();
    await expect(engine.nextStepAsync()).resolves.toBe(false);
  });
});
