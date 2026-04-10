import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';

const basicDefinition: FormDefinition = {
  id: 'basic',
  title: 'Basic Form',
  submit: { label: 'Submit' },
  fields: [
    { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
    { key: 'email', type: 'email', label: 'Email' },
  ],
};

const conditionalDefinition: FormDefinition = {
  id: 'conditional',
  title: 'Conditional',
  submit: { label: 'Submit' },
  fields: [
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      options: [
        { value: 'MX', label: 'Mexico' },
        { value: 'US', label: 'US' },
      ],
    },
    { key: 'clabe', type: 'text', label: 'CLABE', show: [{ field: 'country', eq: 'MX' }] },
    { key: 'routing', type: 'text', label: 'Routing', show: [{ field: 'country', eq: 'US' }] },
  ],
};

describe('FormEngine', () => {
  describe('constructor', () => {
    it('creates engine with fields-only definition', () => {
      const engine = new FormEngine(basicDefinition);
      expect(engine.isMultiStep).toBe(false);
      expect(engine.values).toEqual({});
    });

    it('applies initialValues', () => {
      const engine = new FormEngine(basicDefinition, { name: 'John' });
      expect(engine.values.name).toBe('John');
    });

    it('applies field defaultValue', () => {
      const definition: FormDefinition = {
        id: 'defaults',
        title: 'Defaults',
        submit: { label: 'Submit' },
        fields: [{ key: 'country', type: 'select', label: 'Country', defaultValue: 'US' }],
      };
      const engine = new FormEngine(definition);
      expect(engine.values.country).toBe('US');
    });

    it('initialValues override defaultValue', () => {
      const definition: FormDefinition = {
        id: 'defaults',
        title: 'Defaults',
        submit: { label: 'Submit' },
        fields: [{ key: 'country', type: 'select', label: 'Country', defaultValue: 'US' }],
      };
      const engine = new FormEngine(definition, { country: 'MX' });
      expect(engine.values.country).toBe('MX');
    });

    it('throws when both fields and steps are non-empty', () => {
      const definition: FormDefinition = {
        id: 'invalid',
        title: 'Invalid',
        submit: { label: 'Submit' },
        fields: [{ key: 'a', type: 'text', label: 'A' }],
        steps: [{ id: 's1', title: 'S1', fields: [{ key: 'b', type: 'text', label: 'B' }] }],
      };
      expect(() => new FormEngine(definition)).toThrow('cannot have both');
    });
  });

  describe('setValue', () => {
    it('sets a value and clears field error', () => {
      const engine = new FormEngine(basicDefinition);
      engine.errors = { name: 'Required' };
      engine.setValue('name', 'John');
      expect(engine.values.name).toBe('John');
      expect(engine.errors.name).toBeUndefined();
    });

    it('notifies subscribers', () => {
      const engine = new FormEngine(basicDefinition);
      const listener = vi.fn();
      engine.subscribe(listener);
      engine.setValue('name', 'John');
      expect(listener).toHaveBeenCalledOnce();
    });

    it('clears hidden fields on cascade', () => {
      const engine = new FormEngine(conditionalDefinition, { country: 'MX', clabe: '123' });
      expect(engine.values.clabe).toBe('123');

      // Change country to US, clabe should be cleared
      engine.setValue('country', 'US');
      expect(engine.values.clabe).toBeUndefined();
    });

    it('cascade: field A hides field B which hides field C', () => {
      const definition: FormDefinition = {
        id: 'cascade',
        title: 'Cascade',
        submit: { label: 'Submit' },
        fields: [
          { key: 'a', type: 'select', label: 'A' },
          { key: 'b', type: 'text', label: 'B', show: [{ field: 'a', eq: 'show' }] },
          { key: 'c', type: 'text', label: 'C', show: [{ field: 'b', notEmpty: true }] },
        ],
      };
      const engine = new FormEngine(definition, { a: 'show', b: 'hello', c: 'world' });
      expect(engine.values.c).toBe('world');

      // Hide B by changing A
      engine.setValue('a', 'hide');
      // B cleared (hidden), C cleared (depends on B which is now empty)
      expect(engine.values.b).toBeUndefined();
      expect(engine.values.c).toBeUndefined();
    });
  });

  describe('visibleFields', () => {
    it('returns only visible fields', () => {
      const engine = new FormEngine(conditionalDefinition, { country: 'MX' });
      const keys = engine.visibleFields.map((f) => f.key);
      expect(keys).toContain('country');
      expect(keys).toContain('clabe');
      expect(keys).not.toContain('routing');
    });
  });

  describe('validate', () => {
    it('returns errors for invalid visible fields', () => {
      const engine = new FormEngine(basicDefinition);
      const errors = engine.validate();
      expect(errors.name).toBe('This field is required');
    });

    it('does not validate hidden fields', () => {
      const definition: FormDefinition = {
        id: 'hidden-validation',
        title: 'Hidden',
        submit: { label: 'Submit' },
        fields: [
          {
            key: 'hidden',
            type: 'text',
            label: 'Hidden',
            validation: { required: true },
            show: [{ field: 'x', eq: 'y' }],
          },
        ],
      };
      const engine = new FormEngine(definition);
      const errors = engine.validate();
      expect(errors.hidden).toBeUndefined();
    });
  });

  describe('validateField', () => {
    it('validates a single field and updates errors', () => {
      const engine = new FormEngine(basicDefinition);
      const error = engine.validateField('name');
      expect(error).toBe('This field is required');
      expect(engine.errors.name).toBe('This field is required');
    });

    it('clears error when field is valid', () => {
      const engine = new FormEngine(basicDefinition, { name: 'John' });
      engine.errors = { name: 'old error' };
      const error = engine.validateField('name');
      expect(error).toBeNull();
      expect(engine.errors.name).toBeUndefined();
    });
  });

  describe('getSubmitValues', () => {
    it('returns only visible field values', () => {
      const engine = new FormEngine(conditionalDefinition, {
        country: 'MX',
        clabe: '123',
        routing: '456',
      });
      // routing should have been cascade-cleared since country=MX hides it
      const values = engine.getSubmitValues();
      expect(values.country).toBe('MX');
      expect(values.clabe).toBe('123');
      expect(values.routing).toBeUndefined();
    });
  });

  describe('setErrors', () => {
    it('sets errors on visible fields', () => {
      const engine = new FormEngine(basicDefinition);
      engine.setErrors({ name: 'Server says no' });
      expect(engine.errors.name).toBe('Server says no');
    });

    it('surfaces errors on hidden fields as top-level errors', () => {
      const engine = new FormEngine(conditionalDefinition, { country: 'US' });
      engine.setErrors({ clabe: 'Invalid CLABE' });
      // clabe is hidden (country != MX), so error goes to topLevelErrors
      expect(engine.errors.clabe).toBeUndefined();
      expect(engine.topLevelErrors).toContain('Invalid CLABE');
    });

    it('replaces previous errors instead of merging', () => {
      const engine = new FormEngine(basicDefinition);
      engine.setErrors({ name: 'First error' });
      expect(engine.errors.name).toBe('First error');

      engine.setErrors({ email: 'Second error' });
      expect(engine.errors.name).toBeUndefined();
      expect(engine.errors.email).toBe('Second error');
    });
  });

  describe('subscribe / getSnapshot', () => {
    it('increments version on mutation', () => {
      const engine = new FormEngine(basicDefinition);
      const v1 = engine.getSnapshot();
      engine.setValue('name', 'test');
      expect(engine.getSnapshot()).toBe(v1 + 1);
    });

    it('unsubscribe stops listener', () => {
      const engine = new FormEngine(basicDefinition);
      const listener = vi.fn();
      const unsub = engine.subscribe(listener);
      engine.setValue('name', 'test');
      expect(listener).toHaveBeenCalledOnce();

      unsub();
      engine.setValue('name', 'test2');
      expect(listener).toHaveBeenCalledOnce(); // Not called again
    });

    it('multiple subscribers work independently', () => {
      const engine = new FormEngine(basicDefinition);
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const unsub1 = engine.subscribe(listener1);
      engine.subscribe(listener2);

      engine.setValue('name', 'test');
      expect(listener1).toHaveBeenCalledOnce();
      expect(listener2).toHaveBeenCalledOnce();

      unsub1();
      engine.setValue('name', 'test2');
      expect(listener1).toHaveBeenCalledOnce(); // Not called
      expect(listener2).toHaveBeenCalledTimes(2); // Still works
    });
  });

  describe('reset', () => {
    it('resets to defaults and step 0', () => {
      const definition: FormDefinition = {
        id: 'reset',
        title: 'Reset',
        submit: { label: 'Submit' },
        fields: [{ key: 'name', type: 'text', label: 'Name', defaultValue: 'default' }],
      };
      const engine = new FormEngine(definition, { name: 'modified' });
      engine.errors = { name: 'error' };
      engine.reset();
      expect(engine.values.name).toBe('default');
      expect(engine.errors).toEqual({});
    });

    it('resets to provided values', () => {
      const engine = new FormEngine(basicDefinition);
      engine.setValue('name', 'modified');
      engine.reset({ name: 'new' });
      expect(engine.values.name).toBe('new');
    });
  });

  describe('setFieldLoading', () => {
    it('sets and clears loading state', () => {
      const engine = new FormEngine(basicDefinition);
      engine.setFieldLoading('name', true);
      expect(engine.fieldLoading.name).toBe(true);
      engine.setFieldLoading('name', false);
      expect(engine.fieldLoading.name).toBeUndefined();
    });
  });

  describe('custom validators in constructor', () => {
    it('uses validators passed to constructor during validate', () => {
      const definition: FormDefinition = {
        id: 'custom',
        title: 'Custom',
        submit: { label: 'Submit' },
        fields: [
          { key: 'code', type: 'text', label: 'Code', validation: { validator: 'checkCode' } },
        ],
      };
      const engine = new FormEngine(
        definition,
        { code: 'bad' },
        {
          validators: {
            checkCode: (value) => (value === 'good' ? null : 'Invalid code'),
          },
        },
      );
      const errors = engine.validate();
      expect(errors.code).toBe('Invalid code');
    });
  });
});
