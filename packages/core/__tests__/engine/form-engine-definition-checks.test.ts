import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { checkDefinition } from '../../src/definition-validation';
import { validateFieldValue } from '../../src/validation';
import { evaluateCondition } from '../../src/visibility';
import type { FormDefinition, FormStep } from '../../src/types';

function form(steps: FormStep[]): FormDefinition {
  return { id: 'checks', title: '', submit: { label: 'Submit' }, steps };
}

function text(key: string, extra: object = {}) {
  return { key, type: 'text', label: key, ...extra };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('definition checks', () => {
  it('warns that the engine rejects fields and steps together', () => {
    const definition = { ...form([{ id: 'a', title: '', fields: [text('a')] }]), fields: [text('b')] };
    const message = '/: the definition has both "fields" and "steps". Move the top-level fields into a step, or remove "steps".';
    expect(checkDefinition(definition)[0].message).toBe(message);
    expect(() => new FormEngine(definition)).toThrow(message);
  });

  it('rejects duplicate step ids without routes', () => {
    const definition = form([
      { id: 'a', title: '', fields: [text('x')] },
      { id: 'a', title: '', fields: [text('y')] },
    ]);
    expect(() => new FormEngine(definition)).toThrow('/steps/1/id: step id "a" is already used by /steps/0.');
    expect(checkDefinition(definition).map((issue) => issue.code)).toEqual(['duplicate-step-id']);
  });

  it.each(['__proto__', 'constructor', 'prototype', 'toString', 'hasOwnProperty'])('rejects the reserved field key %s', (key) => {
    const definition = form([{ id: 'a', title: '', fields: [text(key, { validation: { required: true } })] }]);
    const message = `/steps/0/fields/0/key: "${key}" is a built-in object property name. Rename the field key.`;
    expect(() => new FormEngine(definition)).toThrow(message);
    expect(checkDefinition(definition).map((issue) => issue.message)).toEqual([message]);
  });

  it('rejects a reserved field key in a single-step form', () => {
    const definition: FormDefinition = {
      id: 'flat',
      title: '',
      submit: { label: 'Submit' },
      fields: [text('constructor')] as FormDefinition['fields'],
    };
    expect(() => new FormEngine(definition)).toThrow('/fields/0/key: "constructor" is a built-in object property name.');
  });

  it.each([true, false])('rejects conditions on the same or a later step (routes: %s)', (routed) => {
    const definition = form([
      {
        id: 'a',
        title: '',
        fields: [text('kind'), text('early', { show: [{ field: 'later', eq: 'y' }] })],
        routes: routed ? [{ to: 'c', show: [{ field: 'kind', eq: 'x' }] }] : undefined,
      },
      {
        id: 'b',
        title: '',
        show: [{ field: 'own', notEmpty: true }],
        fields: [text('own'), text('mine', { show: [{ field: 'own', eq: 'z' }] })],
      },
      { id: 'c', title: '', showAny: [{ field: 'later', eq: 'y' }], fields: [] },
      { id: 'd', title: '', show: [{ field: 'kind', eq: 'x' }], fields: [text('later')] },
    ]);
    expect(
      checkDefinition(definition)
        .filter((issue) => issue.code === 'forward-reference')
        .map(({ severity, path }) => `${severity} ${path}`),
    ).toEqual(['error /steps/0/fields/1/show/0/field', 'error /steps/1/show/0/field', 'error /steps/2/showAny/0/field']);
  });

  it('warns about validator names missing from options', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const definition = form([
      { id: 'a', title: '', fields: [text('x', { validation: { validator: 'nope' } }), text('y', { validation: { validator: 'ok' } })] },
    ]);
    new FormEngine(definition, {}, { validators: { ok: () => null } });
    expect(warn.mock.calls.map(([message]) => message)).toEqual([
      '[formhaus] /steps/0/fields/0/validation/validator: the validator "nope" is not registered. Pass it in the "validators" option.',
    ]);
  });

  it('sends warnings to onWarning instead of the console', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onWarning = vi.fn();
    new FormEngine(form([{ id: 'a', title: '', fields: [text('x', { type: 'txt' })] }]), {}, { onWarning });
    expect(onWarning.mock.calls.map(([issue]) => issue.code)).toEqual(['unknown-field-type']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('sends a custom type name warning to onWarning and still renders the field', () => {
    const onWarning = vi.fn();
    const engine = new FormEngine(form([{ id: 'a', title: '', fields: [text('x', { type: 'stars' })] }]), { x: 4 }, { onWarning });
    expect(onWarning.mock.calls.map(([issue]) => issue.code)).toEqual(['custom-type-name']);
    expect(engine.validate()).toEqual({});
  });

  it('does not log warnings in production', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    new FormEngine(form([{ id: 'a', title: '', fields: [text('x', { type: 'txt' }), text('y', { type: 'stars' })] }]));
    vi.unstubAllEnvs();
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('runtime consistency', () => {
  it('treats an empty array as empty for notEmpty and false as a value', () => {
    expect(evaluateCondition({ field: 'tags', notEmpty: true }, { tags: [] })).toBe(false);
    expect(evaluateCondition({ field: 'tags', notEmpty: true }, { tags: ['a'] })).toBe(true);
    expect(evaluateCondition({ field: 'ok', notEmpty: true }, { ok: false })).toBe(true);
  });

  it('normalises an empty validator result to null', () => {
    const field = text('x', { validation: { validator: 'blank' } });
    expect(validateFieldValue(field, 'a', {}, { validators: { blank: () => '' } })).toBeNull();
  });

  it.each([false, true])('gives skipped step fields no value for matchField (routes: %s)', async (routes) => {
    const definition = form([
      { id: 'a', title: '', fields: [text('start')], ...(routes ? { routes: [{ to: 'b' }] } : {}) },
      { id: 'b', title: '', skip: { label: 'Skip' }, fields: [text('plan', { defaultValue: 'free' })] },
      { id: 'c', title: '', fields: [text('confirm', { validation: { matchField: 'plan' } })] },
    ]);
    const engine = new FormEngine(definition, { confirm: 'free' });
    await engine.next();
    await engine.skip();
    expect(engine.currentStep?.id).toBe('c');
    expect(engine.validateField('confirm')).toBe('Fields must match');
  });
});
