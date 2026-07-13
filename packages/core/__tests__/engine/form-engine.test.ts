import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { basicDefinition, conditionalDefinition } from './form-engine.fixtures';

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

    it('clears visibility dependency chains longer than the old pass limit', () => {
      const fieldCount = 75; // > 50, the old fixed-pass limit
      const fields = Array.from({ length: fieldCount }, (_, index) => ({
        key: `field-${index}`,
        type: 'text' as const,
        label: `Field ${index}`,
        ...(index < fieldCount - 1
          ? { show: [{ field: `field-${index + 1}`, eq: 'visible' }] }
          : {}),
      }));
      const initialValues = Object.fromEntries(fields.map((field) => [field.key, 'visible']));
      const definition: FormDefinition = {
        id: 'long-cascade',
        title: 'Long cascade',
        submit: { label: 'Submit' },
        fields,
      };
      const engine = new FormEngine(definition, initialValues);

      engine.setValue(`field-${fieldCount - 1}`, 'hidden');

      expect(engine.values).toEqual({ [`field-${fieldCount - 1}`]: 'hidden' });
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

    it('does not validate the current step until canGoNext is read', () => {
      const validator = vi.fn(() => null);
      const definition: FormDefinition = {
        id: 'lazy-validation',
        title: 'Lazy validation',
        submit: { label: 'Submit' },
        steps: [
          {
            id: 'details',
            title: 'Details',
            fields: [
              {
                key: 'code',
                type: 'text',
                label: 'Code',
                validation: { validator: 'checkCode' },
              },
            ],
          },
        ],
      };
      const engine = new FormEngine(definition, { code: 'first' }, {
        validators: { checkCode: validator },
      });

      expect(engine.visibleFields).toHaveLength(1);
      expect(validator).not.toHaveBeenCalled();

      expect(engine.canGoNext).toBe(true);
      expect(engine.canGoNext).toBe(true);
      expect(validator).toHaveBeenCalledOnce();

      engine.setValue('code', 'second');
      expect(engine.visibleFields).toHaveLength(1);
      expect(validator).toHaveBeenCalledOnce();

      expect(engine.canGoNext).toBe(true);
      expect(validator).toHaveBeenCalledTimes(2);
    });
  });

});
