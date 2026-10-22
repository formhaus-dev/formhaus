import { describe, expect, it } from 'vitest';
import type { FieldValidation, FormDefinition, FormField } from '../../src';
import { validateSubmission } from '../../src/server';

const business = [{ field: 'type', eq: 'business' }];

function form(...fields: Partial<FormField>[]): FormDefinition {
  return {
    id: 'account',
    title: 'Account',
    submit: { label: 'Save' },
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
      { key: 'email', type: 'email', label: 'Email' },
      ...fields.map((field) => ({ key: 'company', type: 'text', label: 'Company', show: business, ...field }) as FormField),
    ],
  };
}

const kept = (definition: FormDefinition, values: Record<string, unknown>, options = {}) =>
  validateSubmission(definition, { type: 'personal', ...values }, { hiddenValues: 'keep', ...options });

const rule = (validation: FieldValidation, type = 'text') => form({ type, validation } as Partial<FormField>);

describe('validateSubmission with hiddenValues: keep', () => {
  it.each<[string, FormDefinition, unknown, unknown]>([
    ['min', rule({ min: 10 }, 'number'), -5, 12],
    ['max', rule({ max: 10 }, 'number'), 11, 10],
    ['minLength', rule({ minLength: 3 }), 'ab', 'abc'],
    ['maxLength', rule({ maxLength: 3 }), 'abcd', 'abc'],
    ['pattern', rule({ pattern: '^[A-Z]+$' }), 'acme', 'ACME'],
    [
      'multiselect minLength',
      form({
        type: 'multiselect',
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        validation: { minLength: 2 },
      }),
      ['a'],
      ['a', 'b'],
    ],
    [
      'optionsFrom select maxLength',
      form({ type: 'select', optionsFrom: 'companies', validation: { maxLength: 20 } }),
      'x'.repeat(9000),
      'acme',
    ],
  ])('drops a hidden value that fails %s and keeps a valid one', (_, definition, invalid, valid) => {
    expect(kept(definition, { company: invalid })).toEqual({ values: { type: 'personal' }, errors: {} });
    expect(kept(definition, { company: valid })).toEqual({ values: { type: 'personal', company: valid }, errors: {} });
  });

  it('checks matchField against the other answers', () => {
    const definition = rule({ matchField: 'email' });
    expect(kept(definition, { email: 'a@b.co', company: 'x@b.co' }).values).toEqual({ type: 'personal', email: 'a@b.co' });
    expect(kept(definition, { email: 'a@b.co', company: 'a@b.co' }).values).toEqual({
      type: 'personal',
      email: 'a@b.co',
      company: 'a@b.co',
    });
  });

  it('runs a custom validator passed to the server', () => {
    const definition = rule({ validator: 'acme' });
    const validators = { acme: (value: unknown) => (value === 'Acme' ? null : 'Not Acme') };
    expect(kept(definition, { company: 'Initech' }, { validators }).values).toEqual({ type: 'personal' });
    expect(kept(definition, { company: 'Acme' }, { validators }).values).toEqual({ type: 'personal', company: 'Acme' });
    expect(kept(definition, { company: 'Initech' }).values).toEqual({ type: 'personal', company: 'Initech' });
  });

  it('does not apply required to a hidden value', () => {
    expect(kept(rule({ required: true, minLength: 3 }), { company: '' })).toEqual({
      values: { type: 'personal', company: '' },
      errors: {},
    });
  });

  it('leaves the default path unchanged', () => {
    expect(validateSubmission(rule({ min: 10 }, 'number'), { type: 'personal', company: 12 })).toEqual({
      values: { type: 'personal' },
      errors: {},
    });
  });

  it('strips prototype keys next to a kept value', () => {
    const values = JSON.parse('{"type":"personal","company":"Acme","__proto__":{"company":"Eve","polluted":true}}');
    const result = validateSubmission(rule({ minLength: 3 }), values, { hiddenValues: 'keep' });
    expect(result).toEqual({ values: { type: 'personal', company: 'Acme' }, errors: {} });
    expect(Object.getPrototypeOf(result.values)).toBe(Object.prototype);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  describe('repeater items', () => {
    const people = (show?: FormField['show'], minLength = 1) =>
      form({
        key: 'people',
        type: 'group',
        label: 'People',
        show,
        validation: { minLength },
        fields: [
          {
            key: 'role',
            type: 'select',
            label: 'Role',
            options: [
              { value: 'admin', label: 'Admin' },
              { value: 'guest', label: 'Guest' },
            ],
          },
          { key: 'name', type: 'text', label: 'Name', validation: { required: true, minLength: 2 } },
          { key: 'code', type: 'text', label: 'Code', show: [{ field: 'role', eq: 'admin' }], validation: { pattern: '^[0-9]{4}$' } },
        ],
      } as Partial<FormField>);

    it('checks each item field of a hidden group', () => {
      const result = kept(people(business), {
        people: [
          { role: 'admin', name: 'A', code: '1234' },
          { role: 'guest', name: 'Bo', code: 'x' },
        ],
      });
      expect(result).toEqual({
        values: {
          type: 'personal',
          people: [
            { role: 'admin', code: '1234' },
            { role: 'guest', name: 'Bo' },
          ],
        },
        errors: {},
      });
    });

    it('drops a hidden group that fails its own rule', () => {
      expect(kept(people(business, 2), { people: [{ name: 'Bo' }] }).values).toEqual({ type: 'personal' });
      expect(kept(people(business, 2), { people: [{ name: 'Bo' }, { name: 'Al' }] }).values).toEqual({
        type: 'personal',
        people: [{ name: 'Bo' }, { name: 'Al' }],
      });
    });

    it('checks a hidden item field in a visible group', () => {
      const result = kept(people(), {
        people: [
          { role: 'guest', name: 'Al', code: '12' },
          { role: 'guest', name: 'Bo', code: '1234' },
        ],
      });
      expect(result).toEqual({
        values: {
          type: 'personal',
          people: [
            { role: 'guest', name: 'Al' },
            { role: 'guest', name: 'Bo', code: '1234' },
          ],
        },
        errors: {},
      });
    });
  });
});
