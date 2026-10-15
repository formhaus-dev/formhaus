import { describe, expect, it, vi } from 'vitest';
import { evaluateCondition, FormEngine, validateFieldValue, type FormDefinition, type FormField } from '../../src';

const text = (key: string, extra: Partial<FormField> = {}): FormField => ({ key, type: 'text', label: key, ...extra });
const single = (fields: FormField[]): FormDefinition => ({ id: 's', title: 'S', submit: { label: 'Go' }, fields });
const toggle = text('show', { type: 'checkbox' });

describe('visibility rules', () => {
  it('starts a re-shown field empty without restoring its defaultValue', () => {
    const engine = new FormEngine(single([toggle, text('detail', { defaultValue: 'preset', show: [{ field: 'show', eq: true }] })]), {
      show: true,
    });
    expect(engine.values.detail).toBe('preset');
    engine.setValue('show', false);
    engine.setValue('show', true);
    expect(engine.values.detail).toBeUndefined();
  });

  it('removes the error of a field when it becomes hidden', () => {
    const engine = new FormEngine(
      single([toggle, text('detail', { show: [{ field: 'show', eq: true }], validation: { required: true } })]),
      { show: true },
    );
    engine.validate();
    expect(engine.errors.detail).toBe('This field is required');
    engine.setValue('show', false);
    expect(engine.errors.detail).toBeUndefined();
  });
});

describe('payload rules', () => {
  it('keeps null, empty string, false and empty arrays without conversion', () => {
    const fields = [
      text('a'),
      text('b'),
      text('c', { type: 'checkbox' }),
      text('d', { type: 'multiselect', options: [{ value: 'x', label: 'X' }] }),
      text('e', { type: 'number' }),
    ];
    const engine = new FormEngine(single(fields), { a: null, b: '', c: false, d: [], e: 0 });
    expect(engine.getSubmitValues()).toEqual({ a: null, b: '', c: false, d: [], e: 0 });
  });
});

describe('validation rules', () => {
  it('returns the first error in the order type, size, pattern, matchField, validator', () => {
    const validator = vi.fn(() => 'From validator');
    const field = text('code', { validation: { minLength: 5, pattern: '^[0-9]+$', matchField: 'other', validator: 'check' } });
    const validators = { check: validator };
    expect(validateFieldValue(field, 'ab', { other: 'zz' }, validators)).toBe('Must be at least 5 characters');
    expect(validateFieldValue(field, 'abcdef', { other: 'zz' }, validators)).toBe('Invalid format');
    expect(validateFieldValue(field, '123456', { other: 'zz' }, validators)).toBe('Fields must match');
    expect(validateFieldValue(field, '123456', { other: '123456' }, validators)).toBe('From validator');
    expect(validateFieldValue({ ...field, type: 'email' }, 'ab', {}, validators)).toBe('Enter a valid email');
  });

  it('never passes an empty value to a validator', () => {
    const validator = vi.fn(() => 'bad');
    const field = text('x', { validation: { validator: 'check' } });
    for (const empty of [undefined, null, '', []]) expect(validateFieldValue(field, empty, {}, { check: validator })).toBeNull();
    expect(validateFieldValue({ ...field, type: 'checkbox' }, false, {}, { check: validator })).toBeNull();
    expect(validator).not.toHaveBeenCalled();
  });

  it('does not validate on setValue, only on Continue and Submit', () => {
    const engine = new FormEngine(single([text('x', { validation: { required: true, minLength: 3 } })]));
    engine.setValue('x', 'a');
    expect(engine.errors).toEqual({});
  });
});

describe('condition edges', () => {
  it('compares strictly and treats lists and emptiness as specified', () => {
    expect(evaluateCondition({ field: 'a', eq: 1 }, { a: '1' })).toBe(false);
    expect(evaluateCondition({ field: 'a', in: ['x'] }, { a: ['x'] })).toBe(false);
    expect(evaluateCondition({ field: 'a', in: [] }, { a: 'x' })).toBe(false);
    expect(evaluateCondition({ field: 'a', notIn: [] }, { a: 'x' })).toBe(true);
    expect(evaluateCondition({ field: 'a', notEmpty: false }, { a: '' })).toBe(true);
    expect(evaluateCondition({ field: 'a', notEmpty: true }, { a: 0 })).toBe(true);
    expect(evaluateCondition({ field: 'a', notEmpty: true }, { a: false })).toBe(true);
  });
});

describe('steps', () => {
  const steps: FormDefinition = {
    id: 'm',
    title: 'M',
    submit: { label: 'Go' },
    steps: [
      { id: 'one', title: 'One', fields: [text('a')] },
      { id: 'two', title: 'Two', skip: { label: 'Skip' }, fields: [text('b', { defaultValue: 'd' })] },
      { id: 'three', title: 'Three', fields: [] },
    ],
  };

  it('passes reason skip to onAfterStepChange', async () => {
    const after = vi.fn();
    const engine = new FormEngine(steps, {}, { onAfterStepChange: after });
    await engine.next();
    await engine.skip();
    expect(after).toHaveBeenLastCalledWith(expect.objectContaining({ fromStepId: 'two', toStepId: 'three', reason: 'skip' }));
  });

  it('skips only steps that have a skip action', async () => {
    const engine = new FormEngine(steps);
    expect(await engine.skip()).toBe(false);
    expect(engine.currentStep?.id).toBe('one');
  });

  it('treats a definition with neither fields nor steps as an empty single-step form', () => {
    const engine = new FormEngine({ id: 'e', title: 'E', submit: { label: 'Go' } });
    expect(engine.isMultiStep).toBe(false);
    expect(engine.validate()).toEqual({});
    expect(new FormEngine({ id: 'e', title: 'E', submit: { label: 'Go' }, steps: [], fields: [text('a')] }).isMultiStep).toBe(false);
  });
});
