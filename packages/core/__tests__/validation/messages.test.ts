import { describe, expect, it } from 'vitest';
import { FormEngine, getDefaultMessage, validateFieldValue, type FormDefinition, type FormField, type MessageFn } from '../../src';

const password: FormField = { key: 'password', type: 'password', label: 'Password', validation: { required: true, minLength: 8 } };

describe('message catalogs', () => {
  it('asks a function with the key, params and field and uses its result as final text', () => {
    const calls: unknown[] = [];
    const messages: MessageFn = (key, params, field) => {
      calls.push([key, params, field.key]);
      return key === 'minLength' ? `{min} ${String(params.min)}` : undefined;
    };
    expect(validateFieldValue(password, 'abc', {}, undefined, messages)).toBe('{min} 8');
    expect(validateFieldValue(password, '', {}, undefined, messages)).toBe('This field is required');
    expect(calls).toEqual([
      ['minLength', { min: 8 }, 'password'],
      ['required', {}, 'password'],
    ]);
  });

  it('keeps getDefaultMessage output, units included', () => {
    expect(getDefaultMessage('minLength', { min: 3, unit: 'items' })).toBe('Must be at least 3 items');
    expect(getDefaultMessage('minItems', { min: 2 })).toBe('Must be at least 2 items');
    expect(getDefaultMessage('email')).toBe('Enter a valid email');
  });
});

describe('engine messages', () => {
  const definition: FormDefinition = {
    id: 'signup',
    title: 'Sign up',
    submit: { label: 'Send' },
    lang: 'ru',
    messages: { required: 'Обязательное поле', minLength: 'Минимум {min}' },
    fields: [password, { key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
  };

  it('puts the messages option ahead of the definition catalog', () => {
    const engine = new FormEngine(definition, {}, { messages: (key) => (key === 'required' ? 'Pflichtfeld' : undefined) });
    expect(engine.validate()).toEqual({ password: 'Pflichtfeld', name: 'Pflichtfeld' });
    expect(engine.validateField('password')).toBe('Pflichtfeld');
  });

  it('ignores catalog values that are not text', () => {
    const odd = { ...definition, messages: { required: 5, minLength: '' } } as unknown as FormDefinition;
    expect(new FormEngine(odd, { password: 'abc' }).validate()).toEqual({
      password: 'Must be at least 8 characters',
      name: 'This field is required',
    });
  });
});
