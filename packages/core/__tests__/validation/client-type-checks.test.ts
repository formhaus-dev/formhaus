import { describe, expect, it, vi } from 'vitest';
import { FormEngine, validateFieldValue, type FormField } from '../../src';
import { validateSubmission } from '../../src/server';

const field = (type: string, extra: Partial<FormField> = {}): FormField => ({ key: 'x', type, label: 'X', ...extra });

describe('client type checks', () => {
  it.each([
    ['email', 'user@localhost', 'Enter a valid email'],
    ['email', `${'a'.repeat(250)}@b.co`, 'Enter a valid email'],
    ['datetime', '2026-01-01T12:00:00.123456', 'Enter a valid date and time'],
    ['date', '01/02/2026', 'Enter a valid date'],
    ['time', '24:00', 'Enter a valid time'],
    ['time', '7:05', 'Enter a valid time'],
    ['time', '07:05:60', 'Enter a valid time'],
    ['hidden', 42, 'X: Must be text'],
    ['number', Number.NaN, 'Enter a number'],
    ['number', Infinity, 'Enter a number'],
    ['number', '5', 'Enter a number'],
    ['textarea', 'a'.repeat(10001), 'Must be at most 10000 characters'],
    ['checkbox', 'yes', 'Must be true or false'],
  ])('rejects %s %j like the server', (type, value, message) => {
    expect(validateFieldValue(field(type), value, {})).toBe(message);
    const definition = { id: 'f', title: 'F', submit: { label: 'Go' }, fields: [field(type)] };
    if (typeof value !== 'number' || Number.isFinite(value))
      expect(validateSubmission(definition, { x: value }).errors.x ?? message).toBe(message);
  });

  const scalar = (type: string, extra: Partial<FormField> = {}) => ({
    id: 'f',
    title: 'F',
    submit: { label: 'Go' },
    fields: [field(type, { options: [{ value: 'a', label: 'A' }], ...extra })],
  });

  it.each([
    'text',
    'email',
    'phone',
    'number',
    'password',
    'select',
    'autocomplete',
    'radio',
    'checkbox',
    'switch',
    'date',
    'datetime',
    'time',
    'textarea',
    'hidden',
  ])('drops an empty list in an optional %s field like a missing answer', (type) => {
    const validator = vi.fn(() => 'bad');
    expect(
      validateSubmission(scalar(type, { validation: { validator: 'check' } }), { x: [] }, { validators: { check: validator } }),
    ).toEqual({ values: {}, errors: {} });
    expect(new FormEngine(scalar(type), { x: [] }).validate()).toEqual({});
    expect(validator).not.toHaveBeenCalled();
  });

  it.each(['text', 'select', 'number', 'checkbox'])('fails an empty list in a required %s field as required', (type) => {
    const required = scalar(type, { validation: { required: true } });
    expect(validateSubmission(required, { x: [] }).errors).toEqual({ x: 'This field is required' });
    expect(new FormEngine(required, { x: [] }).validate()).toEqual({ x: 'This field is required' });
  });

  it.each([
    ['text', 'Must be text'],
    ['select', 'Select one of the available options'],
    ['number', 'Enter a number'],
    ['checkbox', 'Must be true or false'],
  ])('rejects non-empty lists and objects in a %s field', (type, message) => {
    for (const value of [['a'], [[]], {}]) {
      expect(validateSubmission(scalar(type), { x: value }).errors).toEqual({ x: message });
      expect(new FormEngine(scalar(type), { x: value }).validate()).toEqual({ x: message });
    }
  });

  it('does not let an empty list match a condition on the server', () => {
    const definition = {
      id: 'f',
      title: 'F',
      submit: { label: 'Go' },
      fields: [
        field('text', { key: 'a' }),
        field('text', { key: 'b', show: [{ field: 'a', notEmpty: true }], validation: { required: true } }),
      ],
    };
    expect(validateSubmission(definition, { a: [], b: 'x' })).toEqual({ values: {}, errors: {} });
  });

  it('keeps an empty list in a multiselect', () => {
    expect(validateSubmission(scalar('multiselect'), { x: [] })).toEqual({ values: { x: [] }, errors: {} });
  });
});

describe('validateSubmission options', () => {
  const definition = {
    id: 'f',
    title: 'F',
    submit: { label: 'Go' },
    fields: [field('text', { key: 'card', validation: { validator: 'luhn' } })],
  };

  it('runs validators passed in options', () => {
    const luhn = (value: unknown) => (value === '4242' ? null : 'Invalid card');
    expect(validateSubmission(definition, { card: '1234' }, { validators: { luhn } }).errors).toEqual({ card: 'Invalid card' });
    expect(validateSubmission(definition, { card: '1234' }).errors).toEqual({});
  });

  it('reports a request body passed instead of the values', () => {
    const result = validateSubmission(definition, { values: { card: '4242' }, skippedSteps: [] });
    expect(result.errors.values).toBe(
      'Pass the values object as the second argument, not the request body with "values" and "skippedSteps".',
    );
  });
});
