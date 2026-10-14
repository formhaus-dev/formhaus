import { describe, expect, it } from 'vitest';
import { FormEngine, getDefaultMessage, validateFieldValue, type FormDefinition, type FormField, type MessageFn } from '../../src';

const password: FormField = { key: 'password', type: 'password', label: 'Password', validation: { required: true, minLength: 8 } };
const topics: FormField = { key: 'topics', type: 'multiselect', label: 'Topics', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], validation: { minLength: 2 } };

describe('message catalogs', () => {
  it('formats catalog templates with the rule params', () => {
    expect(validateFieldValue(password, 'short', {}, undefined, { minLength: 'Минимум {min} символов' })).toBe('Минимум 8 символов');
    expect(validateFieldValue(topics, ['a'], {}, undefined, { minItems: 'Выберите {min}' })).toBe('Выберите 2');
  });

  it('keeps field literals ahead of every catalog', () => {
    const field = { ...password, validation: { required: 'Enter a password', minLength: 8, minLengthMessage: 'Too short' } };
    const messages = { required: 'Обязательно', minLength: 'Минимум {min}' };
    expect(validateFieldValue(field, '', {}, undefined, messages)).toBe('Enter a password');
    expect(validateFieldValue(field, 'abc', {}, undefined, messages)).toBe('Too short');
  });

  it('falls back to English for missing or empty entries', () => {
    expect(validateFieldValue(password, '', {}, undefined, { minLength: 'x' })).toBe('This field is required');
    expect(validateFieldValue(password, 'abc', {}, undefined, { minLength: '' })).toBe('Must be at least 8 characters');
  });

  it('asks a function with the key, params and field and uses its result as final text', () => {
    const calls: unknown[] = [];
    const messages: MessageFn = (key, params, field) => {
      calls.push([key, params, field.key]);
      return key === 'minLength' ? `{min} ${String(params.min)}` : undefined;
    };
    expect(validateFieldValue(password, 'abc', {}, undefined, messages)).toBe('{min} 8');
    expect(validateFieldValue(password, '', {}, undefined, messages)).toBe('This field is required');
    expect(calls).toEqual([['minLength', { min: 8 }, 'password'], ['required', {}, 'password']]);
  });

  it('translates type checks and the length limit of text fields', () => {
    const email: FormField = { key: 'email', type: 'email', label: 'Email' };
    const date: FormField = { key: 'day', type: 'date', label: 'Day', validation: { maxLength: 3 } };
    expect(validateFieldValue(email, 'nope', {}, undefined, { email: 'Неверный email' })).toBe('Неверный email');
    expect(validateFieldValue(date, '2024-01-01', {}, undefined, { maxLength: 'Не длиннее {max}' })).toBe('Не длиннее 3');
  });

  it('leaves unknown placeholders intact', () => {
    expect(validateFieldValue(password, 'abc', {}, undefined, { minLength: '{min} of {unknown}' })).toBe('8 of {unknown}');
  });

  it('keeps getDefaultMessage output, units included', () => {
    expect(getDefaultMessage('minLength', { min: 3, unit: 'items' })).toBe('Must be at least 3 items');
    expect(getDefaultMessage('minItems', { min: 2 })).toBe('Must be at least 2 items');
    expect(getDefaultMessage('email')).toBe('Enter a valid email');
  });
});

describe('engine messages', () => {
  const definition: FormDefinition = {
    id: 'signup', title: 'Sign up', submit: { label: 'Send' }, lang: 'ru',
    messages: { required: 'Обязательное поле', minLength: 'Минимум {min}' },
    fields: [password, { key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
  };

  it('uses the definition catalog', () => {
    const engine = new FormEngine(definition, { password: 'abc' });
    expect(engine.validate()).toEqual({ password: 'Минимум 8', name: 'Обязательное поле' });
  });

  it('puts the messages option ahead of the definition catalog', () => {
    const engine = new FormEngine(definition, {}, { messages: (key) => (key === 'required' ? 'Pflichtfeld' : undefined) });
    expect(engine.validate()).toEqual({ password: 'Pflichtfeld', name: 'Pflichtfeld' });
    expect(engine.validateField('password')).toBe('Pflichtfeld');
  });

  it('does not change forms without catalogs', () => {
    const plain = { ...definition, messages: undefined };
    expect(new FormEngine(plain, { password: 'abc' }).validate()).toEqual({ password: 'Must be at least 8 characters', name: 'This field is required' });
  });
});
