import { describe, expect, it } from 'vitest';
import type { FormField } from '../../src/types';
import { validateField } from '../../src/validation';

const makeField = (overrides: Partial<FormField> = {}): FormField => ({
  key: 'test',
  type: 'text',
  label: 'Test',
  ...overrides,
});

describe('validateField', () => {
  describe('required', () => {
    it('returns error for empty string', () => {
      const field = makeField({ validation: { required: true } });
      expect(validateField(field, '', {}, {})).toBe('This field is required');
    });

    it('returns error for null', () => {
      const field = makeField({ validation: { required: true } });
      expect(validateField(field, null, {}, {})).toBe('This field is required');
    });

    it('returns error for undefined', () => {
      const field = makeField({ validation: { required: true } });
      expect(validateField(field, undefined, {}, {})).toBe('This field is required');
    });

    it('returns custom message when string provided', () => {
      const field = makeField({ validation: { required: 'Please enter your name' } });
      expect(validateField(field, '', {}, {})).toBe('Please enter your name');
    });

    it('passes for non-empty value', () => {
      const field = makeField({ validation: { required: true } });
      expect(validateField(field, 'hello', {}, {})).toBeNull();
    });
  });

  describe('minLength', () => {
    it('returns error when too short', () => {
      const field = makeField({ validation: { minLength: 3 } });
      expect(validateField(field, 'ab', {}, {})).toBe('Must be at least 3 characters');
    });

    it('returns custom message', () => {
      const field = makeField({ validation: { minLength: 3, minLengthMessage: 'Too short!' } });
      expect(validateField(field, 'ab', {}, {})).toBe('Too short!');
    });

    it('passes when long enough', () => {
      const field = makeField({ validation: { minLength: 3 } });
      expect(validateField(field, 'abc', {}, {})).toBeNull();
    });

    it('skips check on empty non-required field', () => {
      const field = makeField({ validation: { minLength: 3 } });
      expect(validateField(field, '', {}, {})).toBeNull();
    });
  });

  describe('maxLength', () => {
    it('returns error when too long', () => {
      const field = makeField({ validation: { maxLength: 5 } });
      expect(validateField(field, 'abcdef', {}, {})).toBe('Must be at most 5 characters');
    });

    it('passes when within limit', () => {
      const field = makeField({ validation: { maxLength: 5 } });
      expect(validateField(field, 'abc', {}, {})).toBeNull();
    });
  });

  describe('min / max (number)', () => {
    it('returns error when below min', () => {
      const field = makeField({ type: 'number', validation: { min: 10 } });
      expect(validateField(field, 5, {}, {})).toBe('Must be at least 10');
    });

    it('returns error when above max', () => {
      const field = makeField({ type: 'number', validation: { max: 100 } });
      expect(validateField(field, 150, {}, {})).toBe('Must be at most 100');
    });

    it('passes when in range', () => {
      const field = makeField({ type: 'number', validation: { min: 10, max: 100 } });
      expect(validateField(field, 50, {}, {})).toBeNull();
    });
  });

  describe('pattern', () => {
    it('returns error when pattern fails', () => {
      const field = makeField({
        validation: { pattern: '^[0-9]+$', patternMessage: 'Numbers only' },
      });
      expect(validateField(field, 'abc', {}, {})).toBe('Numbers only');
    });

    it('passes when pattern matches', () => {
      const field = makeField({ validation: { pattern: '^[0-9]+$' } });
      expect(validateField(field, '123', {}, {})).toBeNull();
    });

    it('handles invalid regex gracefully', () => {
      const field = makeField({ validation: { pattern: '[invalid(' } });
      // Should not throw, just skip validation
      expect(validateField(field, 'anything', {}, {})).toBeNull();
    });
  });

  describe('matchField', () => {
    it('returns error when fields differ', () => {
      const field = makeField({ key: 'confirmEmail', validation: { matchField: 'email' } });
      expect(
        validateField(field, 'a@b.com', { email: 'x@y.com', confirmEmail: 'a@b.com' }, {}),
      ).toBe('Fields must match');
    });

    it('passes when fields match', () => {
      const field = makeField({ key: 'confirmEmail', validation: { matchField: 'email' } });
      expect(
        validateField(field, 'a@b.com', { email: 'a@b.com', confirmEmail: 'a@b.com' }, {}),
      ).toBeNull();
    });

    it('returns error when target field does not exist', () => {
      const field = makeField({ key: 'confirmEmail', validation: { matchField: 'email' } });
      expect(validateField(field, 'a@b.com', { confirmEmail: 'a@b.com' }, {})).toBe(
        'Fields must match',
      );
    });
  });

  describe('custom validator', () => {
    it('calls custom validator and returns its result', () => {
      const field = makeField({ validation: { validator: 'customCheck' } });
      const validators = {
        customCheck: (_value: unknown) => 'Custom error',
      };
      expect(validateField(field, 'test', {}, validators)).toBe('Custom error');
    });

    it('returns null when custom validator passes', () => {
      const field = makeField({ validation: { validator: 'customCheck' } });
      const validators = {
        customCheck: () => null,
      };
      expect(validateField(field, 'test', {}, validators)).toBeNull();
    });

    it('skips when validator not found in registry', () => {
      const field = makeField({ validation: { validator: 'nonExistent' } });
      expect(validateField(field, 'test', {}, {})).toBeNull();
    });
  });

  describe('array values (multiselect)', () => {
    it('treats empty array as empty for required', () => {
      const field = makeField({ type: 'multiselect', validation: { required: true } });
      expect(validateField(field, [], {}, {})).toBe('This field is required');
    });

    it('passes required with non-empty array', () => {
      const field = makeField({ type: 'multiselect', validation: { required: true } });
      expect(validateField(field, ['a', 'b'], {}, {})).toBeNull();
    });

    it('minLength checks array length', () => {
      const field = makeField({ type: 'multiselect', validation: { minLength: 2 } });
      expect(validateField(field, ['a'], {}, {})).toBe('Must be at least 2 items');
    });

    it('maxLength checks array length', () => {
      const field = makeField({ type: 'multiselect', validation: { maxLength: 2 } });
      expect(validateField(field, ['a', 'b', 'c'], {}, {})).toBe('Must be at most 2 items');
    });

    it('passes minLength/maxLength with correct count', () => {
      const field = makeField({ type: 'multiselect', validation: { minLength: 1, maxLength: 3 } });
      expect(validateField(field, ['a', 'b'], {}, {})).toBeNull();
    });
  });

  describe('no validation rules', () => {
    it('returns null when no validation object', () => {
      const field = makeField();
      expect(validateField(field, 'anything', {}, {})).toBeNull();
    });
  });
});
