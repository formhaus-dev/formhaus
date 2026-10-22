import { describe, expect, it, vi } from 'vitest';
import { FormEngine, recallText, type FormDefinition } from '../../src';
import { recalled } from '../../src/internal';
import { validateSubmission } from '../../src/server';

const definition: FormDefinition = {
  formatVersion: '1.5',
  id: 'account',
  title: 'Account',
  submit: { label: 'Save' },
  steps: [
    {
      id: 'profile',
      title: 'Profile',
      fields: [
        {
          key: 'type',
          type: 'select',
          label: 'Type',
          options: [
            { value: 'personal', label: 'Personal' },
            { value: 'business', label: 'Business' },
          ],
        },
        { key: 'company', type: 'text', label: 'Company', show: [{ field: 'type', eq: 'business' }] },
        { key: 'greeting', type: 'statement', label: 'Hello {{company}}' },
      ],
    },
    {
      id: 'extra',
      title: 'Extra',
      skip: { label: 'Skip' },
      fields: [{ key: 'note', type: 'text', label: 'Note', show: [{ field: 'type', eq: 'business' }] }],
    },
  ],
};

const business = { type: 'business', company: 'Acme', note: 'VIP' };

describe('hiddenValues: keep', () => {
  it('publishes kept values in the values snapshot', () => {
    const engine = new FormEngine(definition, business, { hiddenValues: 'keep' });
    const listener = vi.fn();
    engine.subscribeValues(listener);
    engine.setValue('type', 'personal');
    expect(listener).toHaveBeenCalled();
    expect(engine.getValuesSnapshot()).toEqual({ ...business, type: 'personal' });
  });

  it('does not recall a kept value', () => {
    const engine = new FormEngine(definition, business, { hiddenValues: 'keep' });
    engine.setValue('type', 'personal');
    expect(recallText(definition, 'Hello {{company}}', engine.getSubmitValues(), { engine })).toBe('Hello ');
    expect(recalled(engine, engine.visibleFields[1]).label).toBe('Hello ');
  });

  it('leaves the answers of a skipped step out', async () => {
    const engine = new FormEngine(definition, business, { hiddenValues: 'keep' });
    await engine.next();
    engine.setValue('type', 'personal');
    const submit = vi.fn();
    await engine.goToStep('extra');
    await engine.skip(submit);
    expect(submit).toHaveBeenCalledWith({ type: 'personal', company: 'Acme' }, ['extra']);
  });

  it('returns kept values from validateSubmission only with the option', () => {
    const values = { type: 'personal', company: ' Acme ', note: 'VIP' };
    expect(validateSubmission(definition, values)).toEqual({ values: { type: 'personal' }, errors: {} });
    expect(validateSubmission(definition, values, { hiddenValues: 'keep' })).toEqual({
      values: { type: 'personal', company: 'Acme', note: 'VIP' },
      errors: {},
    });
    expect(validateSubmission(definition, values, { hiddenValues: 'keep', skippedSteps: ['extra'] }).values).toEqual({
      type: 'personal',
      company: 'Acme',
    });
  });

  it('drops a kept value with a type error on the server without an error', () => {
    expect(validateSubmission(definition, { type: 'personal', company: ['Acme'] }, { hiddenValues: 'keep' })).toEqual({
      values: { type: 'personal' },
      errors: {},
    });
  });

  it('reports a values change after reset drops a kept value', () => {
    const engine = new FormEngine(definition, { type: 'business' }, { hiddenValues: 'keep' });
    engine.setValue('company', 'Acme');
    engine.setValue('type', 'personal');
    engine.getValuesSnapshot();
    const listener = vi.fn();
    engine.subscribeValues(listener);
    engine.reset({ type: 'personal' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(engine.values).toEqual({ type: 'personal' });
    expect(engine.getSubmitValues()).toEqual({ type: 'personal' });
  });

  it('reports no values change when a write leaves the kept values the same', () => {
    const engine = new FormEngine(definition, business, { hiddenValues: 'keep' });
    engine.setValue('type', 'personal');
    const snapshot = engine.getValuesSnapshot();
    const listener = vi.fn();
    engine.subscribeValues(listener);
    engine.setValue('company', 'Acme');
    expect(listener).not.toHaveBeenCalled();
    expect(engine.getValuesSnapshot()).toBe(snapshot);
  });

  it('adds no key for a hidden field without a value', () => {
    const engine = new FormEngine(definition, { type: 'personal' }, { hiddenValues: 'keep' });
    expect(Object.hasOwn(engine.values, 'company')).toBe(false);
    const translated: FormDefinition = {
      ...definition,
      steps: definition.steps!.map((step, index) =>
        index
          ? step
          : { ...step, fields: step.fields.map((field) => (field.key === 'company' ? { ...field, defaultValue: 'Initech' } : field)) },
      ),
    };
    const next = new FormEngine(translated, { ...engine.values, type: 'business' }, { hiddenValues: 'keep' });
    expect(next.values).toMatchObject({ type: 'business', company: 'Initech' });
  });

  it('reports a values change when a write drops a kept value before any snapshot', () => {
    const engine = new FormEngine(definition, { type: 'personal', company: 'Acme' }, { hiddenValues: 'keep' });
    const listener = vi.fn();
    engine.subscribeValues(listener);
    engine.setValue('company', undefined);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(engine.values.company).toBeUndefined();
    expect(engine.getSubmitValues()).toEqual({ type: 'personal' });
  });

  it('leaves the options passed to notify unchanged', () => {
    const engine = new FormEngine(definition, business, { hiddenValues: 'keep' });
    expect(engine.values).toMatchObject(business);
    const options = { valuesChanged: true };
    (engine as unknown as { notify(options: object): void }).notify(options);
    expect(options).toEqual({ valuesChanged: true });
  });
});
