import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';

function createStepDefinition(id: string, required = false): FormDefinition {
  return {
    id,
    title: 'Step form',
    submit: { label: 'Submit' },
    steps: [
      {
        id: 'first',
        title: 'First',
        fields: [{
          key: 'a',
          type: 'text',
          label: 'A',
          ...(required ? { validation: { required: true } } : {}),
        }],
      },
      { id: 'second', title: 'Second', fields: [{ key: 'b', type: 'text', label: 'B' }] },
    ],
  };
}

describe('FormEngine structure subscriptions', () => {
  it('notifies only for possible visibility changes', () => {
    const definition: FormDefinition = {
      id: 'conditional-structure',
      title: 'Conditional structure',
      submit: { label: 'Submit' },
      fields: [
        { key: 'country', type: 'text', label: 'Country' },
        {
          key: 'region',
          type: 'text',
          label: 'Region',
          show: [{ field: 'country', eq: 'US' }],
        },
      ],
    };
    const engine = new FormEngine(definition, { country: 'US' });
    const listener = vi.fn();
    const snapshot = engine.getStructureSnapshot();
    engine.subscribeStructure(listener);
    engine.setValue('region', 'CA');
    expect(listener).not.toHaveBeenCalled();
    expect(engine.getStructureSnapshot()).toBe(snapshot);
    engine.setValue('country', 'JP');
    expect(listener).toHaveBeenCalledOnce();
    expect(engine.getStructureSnapshot()).toBe(snapshot + 1);
  });

  it('notifies when the current step changes', () => {
    const engine = new FormEngine(createStepDefinition('step-structure'));
    const listener = vi.fn();
    engine.subscribeStructure(listener);
    expect(engine.nextStep()).toBe(true);
    engine.prevStep();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('publishes sync validation errors without a structure update', () => {
    const engine = new FormEngine(createStepDefinition('step-errors', true));
    const fieldListener = vi.fn();
    const structureListener = vi.fn();
    engine.subscribeField('a', fieldListener);
    engine.subscribeStructure(structureListener);
    expect(engine.nextStep()).toBe(false);
    expect(fieldListener).toHaveBeenCalledOnce();
    expect(structureListener).not.toHaveBeenCalled();
  });

  it('publishes async validation errors without a structure update', async () => {
    const engine = new FormEngine(createStepDefinition('async-step-errors'), { a: 'value' }, {
      onStepValidate: async () => ({ a: 'Server error' }),
    });
    const fieldListener = vi.fn();
    const structureListener = vi.fn();
    engine.subscribeField('a', fieldListener);
    engine.subscribeStructure(structureListener);
    await expect(engine.nextStepAsync()).resolves.toBe(false);
    expect(fieldListener).toHaveBeenCalledOnce();
    expect(structureListener).not.toHaveBeenCalled();
  });

  it('does not publish field or structure revisions after rejection', async () => {
    const engine = new FormEngine(createStepDefinition('async-step-rejection'), { a: 'value' }, {
      onStepValidate: async () => {
        throw new Error('Network error');
      },
    });
    const fieldListener = vi.fn();
    const structureListener = vi.fn();
    engine.subscribeField('a', fieldListener);
    engine.subscribeStructure(structureListener);
    await expect(engine.nextStepAsync()).rejects.toThrow('Network error');
    expect(engine.stepValidating).toBe(false);
    expect(fieldListener).not.toHaveBeenCalled();
    expect(structureListener).not.toHaveBeenCalled();
  });

  it('notifies form subscribers once when setErrors changes the step', () => {
    const engine = new FormEngine(createStepDefinition('set-errors-step'));
    expect(engine.nextStep()).toBe(true);
    const listener = vi.fn();
    engine.subscribe(listener);
    engine.setErrors({ a: 'Server error' });
    expect(engine.currentStep?.id).toBe('first');
    expect(listener).toHaveBeenCalledOnce();
  });
});
