import { describe, expect, it, vi } from 'vitest';
import { FormDefinitionError, type FormDefinition, type FormEvent, type FormStep } from '../../src';
import { FormEngine } from '../../src/engine';

const countryStep: FormStep = {
  id: 'country',
  title: 'Country',
  fields: [
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      options: [
        { value: 'us', label: 'United States' },
        { value: 'de', label: 'Germany' },
      ],
      validation: { required: true },
    },
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
  ],
};

const confirmStep: FormStep = { id: 'confirm', title: 'Confirm', fields: [{ key: 'agree', type: 'checkbox', label: 'Agree' }] };

const base: FormDefinition = { id: 'kyc', title: 'KYC', submit: { label: 'Send' }, steps: [countryStep, confirmStep] };

const extended: FormDefinition = {
  ...base,
  steps: [
    countryStep,
    { id: 'tax', title: 'Tax', fields: [{ key: 'ssn', type: 'text', label: 'SSN', validation: { required: true } }] },
    { id: 'address', title: 'Address', fields: [{ key: 'street', type: 'text', label: 'Street', defaultValue: 'Main St' }] },
    confirmStep,
  ],
};

const ids = (engine: FormEngine) => engine.visibleSteps.map(({ id }) => id);

function answered(definition = base) {
  const engine = new FormEngine(definition);
  engine.setValue('country', 'us');
  engine.setValue('name', 'Ada');
  return engine;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

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

  it('ignores a late onStepValidate result', async () => {
    const check = deferred<Record<string, string>>();
    const engine = new FormEngine(base, { country: 'us', name: 'Ada' }, { onStepValidate: () => check.promise });
    const moving = engine.next();
    expect(engine.stepValidating).toBe(true);
    engine.replaceDefinition(extended);
    expect(engine.stepValidating).toBe(false);
    check.resolve({ name: 'Taken' });
    expect(await moving).toBe(false);
    expect(engine.errors).toEqual({});
    expect(engine.currentStep?.id).toBe('country');
    expect(await engine.next()).toBe(false);
  });

  it('ignores a late before-hook and a pending submit', async () => {
    const allow = deferred<boolean>();
    const engine = new FormEngine(base, { country: 'us', name: 'Ada' }, { onBeforeSubmit: () => allow.promise });
    await engine.next();
    const submit = vi.fn();
    const submitting = engine.submit(submit);
    expect(engine.submitting).toBe(true);
    engine.replaceDefinition(extended);
    expect(engine.submitting).toBe(false);
    allow.resolve(true);
    expect(await submitting).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });

  it('applies no errors from a response that arrives after the replacement', async () => {
    const response = deferred<{ ok: false; errors: Record<string, string> }>();
    const engine = new FormEngine(base, { country: 'us', name: 'Ada' });
    await engine.next();
    const submitting = engine.submit(() => response.promise);
    await Promise.resolve();
    engine.replaceDefinition(extended);
    response.resolve({ ok: false, errors: { name: 'Taken' } });
    expect(await submitting).toBe(false);
    expect(engine.errors).toEqual({});
    expect(engine.currentStep?.id).toBe('confirm');
  });

  it('keeps a skipped step skipped when it still exists', async () => {
    const optional = {
      ...extended,
      steps: extended.steps!.map((step) => (step.id === 'address' ? { ...step, skip: { label: 'Skip' } } : step)),
    };
    const engine = answered(optional);
    await engine.next();
    engine.setValue('ssn', '1');
    await engine.next();
    expect(await engine.skip()).toBe(true);
    expect(engine.isStepSkipped('address')).toBe(true);
    engine.replaceDefinition({ ...optional, title: 'KYC v2' });
    expect(engine.isStepSkipped('address')).toBe(true);
    expect(engine.getSubmitValues()).toEqual({ country: 'us', name: 'Ada', ssn: '1' });
    engine.replaceDefinition(base);
    expect(engine.isStepSkipped('address')).toBe(false);
  });

  it('reports step and visibility changes without a reset event', async () => {
    const events: FormEvent[] = [];
    const conditional: FormDefinition = {
      ...base,
      steps: [countryStep, { ...confirmStep, fields: [{ ...confirmStep.fields[0], show: [{ field: 'country', eq: 'us' }] }] }],
    };
    const engine = new FormEngine(conditional, { country: 'us', name: 'Ada' }, { onFormEvent: (event) => events.push(event) });
    engine.start();
    await engine.next();
    events.length = 0;
    engine.replaceDefinition({
      ...base,
      steps: [
        countryStep,
        { ...confirmStep, fields: [{ ...confirmStep.fields[0], show: [{ field: 'country', eq: 'de' }] }] },
        { id: 'done', title: 'Done', fields: [] },
      ],
    });
    expect(events).toEqual([{ type: 'field_hidden', fieldKey: 'agree' }]);
    events.length = 0;
    engine.replaceDefinition({ ...base, steps: [countryStep, { id: 'done', title: 'Done', fields: [] }] });
    expect(events).toEqual([{ type: 'step_viewed', stepId: 'country', stepIndex: 0 }]);
  });

  it('notifies listeners once with a structure change', () => {
    const engine = answered();
    const listener = vi.fn();
    const structure = vi.fn();
    const values = vi.fn();
    const field = vi.fn();
    engine.subscribe(listener);
    engine.subscribeStructure(structure);
    engine.subscribeValues(values);
    engine.subscribeField('ssn', field);
    engine.replaceDefinition(extended);
    expect([listener, structure, values, field].map((spy) => spy.mock.calls.length)).toEqual([1, 1, 1, 1]);
  });

  it('keeps group items and their ids', () => {
    const group: FormDefinition = {
      id: 'people',
      title: 'People',
      submit: { label: 'Send' },
      fields: [{ key: 'people', type: 'group', label: 'People', fields: [{ key: 'name', type: 'text', label: 'Name' }] }],
    };
    const engine = new FormEngine(group, { people: [{ name: 'Ada' }] });
    const [item] = engine.items('people');
    engine.setErrors({ 'people.0.name': 'Taken', 'people.1.name': 'Gone' });
    expect(engine.errors).toEqual({ 'people.0.name': 'Taken' });
    engine.replaceDefinition({
      ...group,
      fields: [
        {
          key: 'people',
          type: 'group',
          label: 'People',
          fields: [
            { key: 'name', type: 'text', label: 'Name' },
            { key: 'role', type: 'text', label: 'Role', defaultValue: 'owner' },
          ],
        },
      ],
    });
    expect(engine.items('people').map(({ id }) => id)).toEqual([item.id]);
    expect(engine.values.people).toEqual([expect.objectContaining({ name: 'Ada', role: 'owner' })]);
    expect(engine.errors).toEqual({ 'people.0.name': 'Taken' });
    engine.replaceDefinition({
      ...group,
      fields: [{ key: 'people', type: 'group', label: 'People', fields: [{ key: 'role', type: 'text', label: 'Role' }] }],
    });
    expect(engine.errors).toEqual({});
  });

  it('turns a single-page form into steps', () => {
    const engine = new FormEngine({ ...base, steps: undefined, fields: countryStep.fields }, { name: 'Ada' });
    engine.replaceDefinition(extended);
    expect(engine.isMultiStep).toBe(true);
    expect(engine.currentStep?.id).toBe('country');
    expect(engine.values).toEqual({ name: 'Ada', street: 'Main St' });
  });
});
