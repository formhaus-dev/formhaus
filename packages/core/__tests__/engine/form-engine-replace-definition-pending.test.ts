import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition, FormEvent } from '../../src';
import { FormEngine } from '../../src/engine';
import { answered, base, confirmStep, countryStep, deferred, extended } from './form-engine-replace-definition.fixtures';

describe('FormEngine.replaceDefinition: pending work, skips and notifications', () => {
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
});
