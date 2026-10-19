import { describe, expect, it, vi } from 'vitest';
import { FormDefinitionError, type FormStep } from '../../src';
import { FormEngine } from '../../src/engine';
import { answered, base, confirmStep, countryStep, extended, ids } from './form-engine-replace-definition.fixtures';

describe('FormEngine.replaceDefinition', () => {
  it('keeps answers, stays on the step and submits values from both definitions', async () => {
    const engine = answered();
    engine.replaceDefinition(extended);
    expect(engine.definition).toBe(extended);
    expect(engine.values).toEqual({ country: 'us', name: 'Ada', street: 'Main St' });
    expect(engine.currentStep?.id).toBe('country');
    expect(ids(engine)).toEqual(['country', 'tax', 'address', 'confirm']);
    expect(await engine.next()).toBe(true);
    expect(engine.currentStep?.id).toBe('tax');
    engine.setValue('ssn', '123');
    expect(await engine.next()).toBe(true);
    expect(await engine.next()).toBe(true);
    engine.setValue('agree', true);
    const submit = vi.fn();
    expect(await engine.submit(submit)).toBe(true);
    expect(submit).toHaveBeenCalledWith({ country: 'us', name: 'Ada', ssn: '123', street: 'Main St', agree: true }, []);
  });

  it('stays on the current step when steps are inserted before it, and submit moves to the first new error', async () => {
    const engine = answered();
    await engine.next();
    engine.setValue('agree', true);
    engine.replaceDefinition(extended);
    expect(engine.currentStep?.id).toBe('confirm');
    expect(engine.currentStepIndex).toBe(3);
    expect(engine.progress).toEqual({ current: 4, total: 4 });
    const submit = vi.fn();
    expect(await engine.submit(submit)).toBe(false);
    expect(submit).not.toHaveBeenCalled();
    expect(engine.currentStep?.id).toBe('tax');
    expect(engine.errors).toEqual({ ssn: 'This field is required' });
  });

  it('moves to the last surviving step before a removed current step', async () => {
    const engine = answered(extended);
    await engine.next();
    engine.setValue('ssn', '123');
    await engine.next();
    expect(engine.currentStep?.id).toBe('address');
    engine.replaceDefinition({ ...extended, steps: [countryStep, extended.steps![1], confirmStep] });
    expect(engine.currentStep?.id).toBe('tax');
    expect(engine.values).toEqual({ country: 'us', name: 'Ada', ssn: '123' });
  });

  it('falls back to the first step when no earlier step survives', async () => {
    const engine = answered();
    await engine.next();
    engine.replaceDefinition({
      ...base,
      steps: [
        { id: 'other', title: 'Other', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
        { id: 'last', title: 'Last', fields: [] },
      ],
    });
    expect(engine.currentStepIndex).toBe(0);
    expect(engine.currentStep?.id).toBe('other');
    expect(engine.values).toEqual({ name: 'Ada' });
  });

  it('drops the value and the error of a field whose type changed, and applies its default', () => {
    const engine = answered();
    engine.setErrors({ name: 'Taken', country: 'Not served' });
    const steps = [
      {
        ...countryStep,
        fields: [countryStep.fields[0], { key: 'name', type: 'textarea', label: 'Name', defaultValue: 'Unknown' }],
      } as FormStep,
      confirmStep,
    ];
    engine.replaceDefinition({ ...base, steps });
    expect(engine.values).toEqual({ country: 'us', name: 'Unknown' });
    expect(engine.errors).toEqual({ country: 'Not served' });
  });

  it('keeps errors of fields that are still shown and drops the others', () => {
    const engine = answered(extended);
    engine.setErrors({ name: 'Taken', ssn: 'Invalid', street: 'Unknown street', ghost: 'Form problem' });
    expect(engine.topLevelErrors).toEqual(['Form problem']);
    engine.replaceDefinition({ ...extended, steps: [countryStep, extended.steps![1], confirmStep] });
    expect(engine.errors).toEqual({ name: 'Taken', ssn: 'Invalid' });
    expect(engine.topLevelErrors).toEqual(['Form problem']);
    engine.setValue('name', 'Grace');
    expect(engine.errors).toEqual({ ssn: 'Invalid' });
  });

  it('clears values hidden by the new definition and restores them when shown again', () => {
    const engine = answered();
    engine.setValue('country', 'de');
    const steps = [
      {
        ...countryStep,
        fields: [countryStep.fields[0], { ...countryStep.fields[1], show: [{ field: 'country', eq: 'us' }] }],
      } as FormStep,
      confirmStep,
    ];
    engine.replaceDefinition({ ...base, steps });
    expect(engine.values).toEqual({ country: 'de' });
    engine.setValue('country', 'us');
    expect(engine.values).toEqual({ country: 'us', name: 'Ada' });
  });

  it('rejects an invalid definition and leaves the engine unchanged', async () => {
    const engine = answered();
    await engine.next();
    const values = engine.values;
    const invalid = { ...base, steps: [countryStep, countryStep] };
    expect(() => engine.replaceDefinition(invalid)).toThrow(FormDefinitionError);
    expect(engine.definition).toBe(base);
    expect(engine.values).toBe(values);
    expect(engine.currentStep?.id).toBe('confirm');
    expect(await engine.back()).toBe(true);
  });

  it('turns a single-page form into steps', () => {
    const engine = new FormEngine({ ...base, steps: undefined, fields: countryStep.fields }, { name: 'Ada' });
    engine.replaceDefinition(extended);
    expect(engine.isMultiStep).toBe(true);
    expect(engine.currentStep?.id).toBe('country');
    expect(engine.values).toEqual({ name: 'Ada', street: 'Main St' });
  });
});
