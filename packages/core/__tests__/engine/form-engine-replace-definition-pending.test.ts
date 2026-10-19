import { describe, expect, it, vi } from 'vitest';
import type { FormDefinition, FormEvent } from '../../src';
import { FormEngine } from '../../src/engine';
import { answered, base, confirmStep, planStep, deferred, extended } from './form-engine-replace-definition.fixtures';

describe('FormEngine.replaceDefinition: pending work, skips and notifications', () => {
  it('ignores a late onStepValidate result', async () => {
    const check = deferred<Record<string, string>>();
    const engine = new FormEngine(base, { plan: 'team', name: 'Ada' }, { onStepValidate: () => check.promise });
    const moving = engine.next();
    expect(engine.stepValidating).toBe(true);
    engine.replaceDefinition(extended);
    expect(engine.stepValidating).toBe(false);
    check.resolve({ name: 'Taken' });
    expect(await moving).toBe(false);
    expect(engine.errors).toEqual({});
    expect(engine.currentStep?.id).toBe('plan');
    expect(await engine.next()).toBe(false);
  });

  it('ignores a late before-hook and a pending submit', async () => {
    const allow = deferred<boolean>();
    const engine = new FormEngine(base, { plan: 'team', name: 'Ada' }, { onBeforeSubmit: () => allow.promise });
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
    const engine = new FormEngine(base, { plan: 'team', name: 'Ada' });
    await engine.next();
    const submitting = engine.submit(() => response.promise);
    await Promise.resolve();
    engine.replaceDefinition(extended);
    response.resolve({ ok: false, errors: { name: 'Taken' } });
    expect(await submitting).toBe(false);
    expect(engine.errors).toEqual({});
    expect(engine.currentStep?.id).toBe('confirm');
  });

  it('blocks a second submit until the dispatched request settles', async () => {
    const response = deferred<void>();
    const engine = new FormEngine(base, { plan: 'team', name: 'Ada' });
    await engine.next();
    const first = vi.fn(() => response.promise);
    const submitting = engine.submit(first);
    await Promise.resolve();
    expect(first).toHaveBeenCalledTimes(1);
    engine.replaceDefinition({ ...base, title: 'Sign up v2' });
    expect(engine.submitting).toBe(true);
    const second = vi.fn();
    expect(await engine.submit(second)).toBe(false);
    expect(second).not.toHaveBeenCalled();
    response.resolve();
    expect(await submitting).toBe(true);
    expect(engine.submitting).toBe(false);
    expect(await engine.submit(second)).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('releases the submit lock when the dispatched request throws after a replacement', async () => {
    const response = deferred<void>();
    const engine = new FormEngine(base, { plan: 'team', name: 'Ada' });
    await engine.next();
    const submitting = engine.submit(async () => {
      await response.promise;
      throw new Error('Network');
    });
    await Promise.resolve();
    engine.replaceDefinition(extended);
    expect(engine.submitting).toBe(true);
    response.resolve();
    await expect(submitting).rejects.toThrow('Network');
    expect(engine.submitting).toBe(false);
  });

  it('keeps a skipped step skipped when it still exists', async () => {
    const optional = {
      ...extended,
      steps: extended.steps!.map((step) => (step.id === 'billing' ? { ...step, skip: { label: 'Skip' } } : step)),
    };
    const engine = answered(optional);
    await engine.next();
    engine.setValue('company', 'Acme');
    await engine.next();
    expect(await engine.skip()).toBe(true);
    expect(engine.isStepSkipped('billing')).toBe(true);
    engine.replaceDefinition({ ...optional, title: 'Sign up v2' });
    expect(engine.isStepSkipped('billing')).toBe(true);
    expect(engine.getSubmitValues()).toEqual({ plan: 'team', name: 'Ada', company: 'Acme' });
    engine.replaceDefinition(base);
    expect(engine.isStepSkipped('billing')).toBe(false);
  });

  it('reports step and visibility changes without a reset event', async () => {
    const events: FormEvent[] = [];
    const conditional: FormDefinition = {
      ...base,
      steps: [planStep, { ...confirmStep, fields: [{ ...confirmStep.fields[0], show: [{ field: 'plan', eq: 'team' }] }] }],
    };
    const engine = new FormEngine(conditional, { plan: 'team', name: 'Ada' }, { onFormEvent: (event) => events.push(event) });
    engine.start();
    await engine.next();
    events.length = 0;
    engine.replaceDefinition({
      ...base,
      steps: [
        planStep,
        { ...confirmStep, fields: [{ ...confirmStep.fields[0], show: [{ field: 'plan', eq: 'solo' }] }] },
        { id: 'done', title: 'Done', fields: [] },
      ],
    });
    expect(events).toEqual([{ type: 'field_hidden', fieldKey: 'agree' }]);
    events.length = 0;
    engine.replaceDefinition({ ...base, steps: [planStep, { id: 'done', title: 'Done', fields: [] }] });
    expect(events).toEqual([{ type: 'step_viewed', stepId: 'plan', stepIndex: 0 }]);
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
    engine.subscribeField('company', field);
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
