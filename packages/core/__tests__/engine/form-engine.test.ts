import { describe, expect, it, vi } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { basicDefinition } from './form-engine.fixtures';

describe('FormEngine', () => {
  describe('constructor', () => {
    it('creates engine with fields-only definition', () => {
      const engine = new FormEngine(basicDefinition);
      expect(engine.isMultiStep).toBe(false);
      expect(engine.values).toEqual({});
    });

    it('throws when both fields and steps are non-empty', () => {
      const definition: FormDefinition = {
        id: 'invalid',
        title: 'Invalid',
        submit: { label: 'Submit' },
        fields: [{ key: 'a', type: 'text', label: 'A' }],
        steps: [{ id: 's1', title: 'S1', fields: [{ key: 'b', type: 'text', label: 'B' }] }],
      };
      expect(() => new FormEngine(definition)).toThrow('both "fields" and "steps"');
    });
  });

  describe('setValue', () => {
    it('notifies subscribers', () => {
      const engine = new FormEngine(basicDefinition);
      const listener = vi.fn();
      engine.subscribe(listener);
      engine.setValue('name', 'John');
      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe('visibleFields', () => {
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
      const engine = new FormEngine(
        definition,
        { code: 'first' },
        {
          validators: { checkCode: validator },
        },
      );

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
