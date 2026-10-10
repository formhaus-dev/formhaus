import { afterEach, describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import { validateDefinition } from '../../src/definition-validation';
import { validateField } from '../../src/validation';
import { evaluateCondition } from '../../src/visibility';
import type { FormDefinition, FormStep } from '../../src/types';

function form(steps: FormStep[]): FormDefinition {
  return { id: 'checks', title: '', submit: { label: 'Submit' }, steps };
}

function text(key: string, extra: object = {}) {
  return { key, type: 'text', label: key, ...extra };
}

afterEach(() => { vi.restoreAllMocks(); });

describe('definition checks', () => {
  it('warns that the engine rejects fields and steps together', () => {
    const definition = { ...form([{ id: 'a', title: '', fields: [text('a')] }]), fields: [text('b')] };
    expect(validateDefinition(definition)[0]).toBe('FormEngine rejects a definition with both "fields" and "steps".');
    expect(() => new FormEngine(definition)).toThrow('FormEngine rejects a definition with both "fields" and "steps".');
  });

  it('rejects duplicate step ids without routes', () => {
    const definition = form([
      { id: 'a', title: '', fields: [text('x')] },
      { id: 'a', title: '', fields: [text('y')] },
    ]);
    expect(() => new FormEngine(definition)).toThrow('Duplicate step id "a"');
    expect(validateDefinition(definition)).toContain('Duplicate step id "a".');
  });

  it.each(['__proto__', 'constructor', 'prototype', 'toString', 'hasOwnProperty'])(
    'rejects the reserved field key %s',
    (key) => {
      const definition = form([{ id: 'a', title: '', fields: [text(key, { validation: { required: true } })] }]);
      expect(() => new FormEngine(definition)).toThrow(`Reserved field key "${key}".`);
      expect(validateDefinition(definition)).toContain(`Reserved field key "${key}".`);
    },
  );

  it('rejects a reserved field key in a single-step form', () => {
    const definition: FormDefinition = { id: 'flat', title: '', submit: { label: 'Submit' }, fields: [text('constructor')] as FormDefinition['fields'] };
    expect(() => new FormEngine(definition)).toThrow('Reserved field key "constructor".');
  });

  it('warns when a routed step condition references its own or a later step', () => {
    const definition = form([
      { id: 'a', title: '', fields: [text('kind')], routes: [{ to: 'c', show: [{ field: 'kind', eq: 'x' }] }] },
      { id: 'b', title: '', show: [{ field: 'own', notEmpty: true }], fields: [text('own')] },
      { id: 'c', title: '', showAny: [{ field: 'later', eq: 'y' }], fields: [] },
      { id: 'd', title: '', show: [{ field: 'kind', eq: 'x' }], fields: [text('later')] },
    ]);
    const warnings = validateDefinition(definition);
    expect(warnings).toContain('Step "b" condition field "own" must belong to an earlier step.');
    expect(warnings).toContain('Step "c" condition field "later" must belong to an earlier step.');
    expect(warnings.some((warning) => warning.includes('Step "d"'))).toBe(false);
    definition.steps!.forEach((step) => { delete step.routes; });
    expect(validateDefinition(definition).some((warning) => warning.includes('earlier step'))).toBe(false);
  });

  it('warns about validator names missing from options', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const definition = form([{ id: 'a', title: '', fields: [text('x', { validation: { validator: 'nope' } }), text('y', { validation: { validator: 'ok' } })] }]);
    new FormEngine(definition, {}, { validators: { ok: () => null } });
    expect(warn.mock.calls.map(([message]) => message)).toEqual(['[FormEngine] Field "x" references unknown validator "nope".']);
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
    expect(validateField(field, 'a', {}, { blank: () => '' })).toBeNull();
  });

  it.each([false, true])('gives skipped step fields no value for matchField (routes: %s)', (routes) => {
    const definition = form([
      { id: 'a', title: '', fields: [text('start')], ...(routes ? { routes: [{ to: 'b' }] } : {}) },
      { id: 'b', title: '', skip: { label: 'Skip' }, fields: [text('plan', { defaultValue: 'free' })] },
      { id: 'c', title: '', fields: [text('confirm', { validation: { matchField: 'plan' } })] },
    ]);
    const engine = new FormEngine(definition, { confirm: 'free' });
    engine.nextStep();
    engine.skipStep();
    expect(engine.currentStep?.id).toBe('c');
    expect(engine.validateField('confirm')).toBe('Fields must match');
  });
});
