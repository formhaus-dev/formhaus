import { describe, expect, it } from 'vitest';
import { validateDefinition } from '../../src/definition-validation';
import type { FormDefinition } from '../../src/types';

describe('validateDefinition', () => {
  describe('duplicate field keys', () => {
    it('warns on duplicate keys in flat fields', () => {
      const definition: FormDefinition = {
        id: 'dup',
        title: 'Dup',
        submit: { label: 'Submit' },
        fields: [
          { key: 'email', type: 'email', label: 'Email' },
          { key: 'email', type: 'text', label: 'Email again' },
        ],
      };
      const warnings = validateDefinition(definition);
      expect(warnings.some((w) => w.includes('Duplicate field key "email"'))).toBe(true);
    });

    it('warns on duplicate keys across steps', () => {
      const definition: FormDefinition = {
        id: 'dup-steps',
        title: 'Dup Steps',
        submit: { label: 'Submit' },
        steps: [
          { id: 's1', title: 'S1', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
          { id: 's2', title: 'S2', fields: [{ key: 'name', type: 'text', label: 'Name again' }] },
        ],
      };
      const warnings = validateDefinition(definition);
      expect(warnings.some((w) => w.includes('Duplicate field key "name"'))).toBe(true);
    });

    it('no warning for unique keys', () => {
      const definition: FormDefinition = {
        id: 'ok',
        title: 'OK',
        submit: { label: 'Submit' },
        fields: [
          { key: 'name', type: 'text', label: 'Name' },
          { key: 'email', type: 'email', label: 'Email' },
        ],
      };
      const warnings = validateDefinition(definition);
      expect(warnings.some((w) => w.includes('Duplicate'))).toBe(false);
    });
  });

  describe('invalid regex patterns', () => {
    it('warns on invalid regex', () => {
      const definition: FormDefinition = {
        id: 'bad-regex',
        title: 'Bad Regex',
        submit: { label: 'Submit' },
        fields: [
          {
            key: 'code',
            type: 'text',
            label: 'Code',
            validation: { pattern: '[invalid(' },
          },
        ],
      };
      const warnings = validateDefinition(definition);
      expect(warnings.some((w) => w.includes('invalid regex pattern'))).toBe(true);
    });

    it('no warning for valid regex', () => {
      const definition: FormDefinition = {
        id: 'good-regex',
        title: 'Good Regex',
        submit: { label: 'Submit' },
        fields: [
          {
            key: 'email',
            type: 'email',
            label: 'Email',
            validation: { pattern: '^[a-z]+@[a-z]+\\.[a-z]+$' },
          },
        ],
      };
      const warnings = validateDefinition(definition);
      expect(warnings.some((w) => w.includes('regex'))).toBe(false);
    });
  });
});
