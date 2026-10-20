import { describe, expect, it, vi } from 'vitest';
import { evaluateCondition, FormEngine, validateFieldValue, type FormField } from '../../src';

const text = (key: string, extra: Partial<FormField> = {}): FormField => ({ key, type: 'text', label: key, ...extra });

describe('validation rules', () => {
  it('returns the first error in the order type, size, pattern, matchField, validator', () => {
    const validator = vi.fn(() => 'From validator');
    const field = text('code', { validation: { minLength: 5, pattern: '^[0-9]+$', matchField: 'other', validator: 'check' } });
    const validators = { check: validator };
    expect(validateFieldValue(field, 'ab', { other: 'zz' }, { validators })).toBe('Minimum length is 5');
    expect(validateFieldValue(field, 'abcdef', { other: 'zz' }, { validators })).toBe('Invalid format');
    expect(validateFieldValue(field, '123456', { other: 'zz' }, { validators })).toBe('Fields must match');
    expect(validateFieldValue(field, '123456', { other: '123456' }, { validators })).toBe('From validator');
    expect(validateFieldValue({ ...field, type: 'email' }, 'ab', {}, { validators })).toBe('Enter a valid email');
  });

  it('never passes an empty value to a validator', () => {
    const validator = vi.fn(() => 'bad');
    const field = text('x', { validation: { validator: 'check' } });
    for (const empty of [undefined, null, '', []])
      expect(validateFieldValue(field, empty, {}, { validators: { check: validator } })).toBeNull();
    expect(validateFieldValue({ ...field, type: 'checkbox' }, false, {}, { validators: { check: validator } })).toBeNull();
    expect(validator).not.toHaveBeenCalled();
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
  it('treats a definition with neither fields nor steps as an empty single-step form', () => {
    const engine = new FormEngine({ id: 'e', title: 'E', submit: { label: 'Go' } });
    expect(engine.isMultiStep).toBe(false);
    expect(engine.validate()).toEqual({});
    expect(new FormEngine({ id: 'e', title: 'E', submit: { label: 'Go' }, steps: [], fields: [text('a')] }).isMultiStep).toBe(false);
  });
});
