import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import map from '../component-map.example.json';
import { countFields, getSteps, parseAndValidate } from '../parse';

const definition = (value: object) => value as unknown as FormDefinition;
const mappedFields = Object.entries(map.fields) as [string, Record<string, unknown>][];

describe('parseAndValidate', () => {
  const valid = (overrides = {}) =>
    JSON.stringify({
      id: 'test',
      title: 'Test',
      submit: { label: 'Go' },
      fields: [{ key: 'name', type: 'text', label: 'Name' }],
      ...overrides,
    });

  it('parses a valid single-step definition', () => {
    const definition = parseAndValidate(valid());
    expect(definition.title).toBe('Test');
    expect(definition.fields).toHaveLength(1);
  });

  it('parses a valid multi-step definition', () => {
    const definition = parseAndValidate(
      valid({
        fields: undefined,
        steps: [
          { id: 's1', title: 'Step 1', fields: [{ key: 'a', type: 'text', label: 'A' }] },
          { id: 's2', title: 'Step 2', fields: [{ key: 'b', type: 'email', label: 'B' }] },
        ],
      }),
    );
    expect(definition.steps).toHaveLength(2);
  });

  it('throws on malformed JSON', () => {
    expect(() => parseAndValidate('{bad}')).toThrow('Invalid JSON');
  });

  it('throws when title is missing', () => {
    expect(() => parseAndValidate(JSON.stringify({ submit: { label: 'Go' }, fields: [] }))).toThrow(
      "'title'",
    );
  });

  it('throws when both fields and steps are missing', () => {
    expect(() => parseAndValidate(JSON.stringify({ title: 'T', submit: { label: 'Go' } }))).toThrow(
      "'fields'",
    );
  });

  it('throws when submit is missing', () => {
    expect(() => parseAndValidate(JSON.stringify({ title: 'T', fields: [] }))).toThrow("'submit'");
  });
});

describe('countFields', () => {
  it('counts single-step fields', () => {
    expect(countFields(definition({ fields: [1, 2, 3] }))).toBe(3);
  });

  it('counts multi-step fields', () => {
    expect(countFields(definition({ steps: [{ fields: [1, 2] }, { fields: [3] }] }))).toBe(3);
  });

  it('returns 0 for empty', () => {
    expect(countFields(definition({ fields: [] }))).toBe(0);
  });
});

describe('getSteps', () => {
  it('returns steps for multi-step definition', () => {
    const steps = getSteps(definition({ steps: [{ title: 'A', fields: [] }] }));
    expect(steps).toHaveLength(1);
    expect(steps[0].title).toBe('A');
  });

  it('wraps fields as single step for single-step definition', () => {
    const steps = getSteps(definition({ title: 'Form', fields: [{ key: 'x' }] }));
    expect(steps).toHaveLength(1);
    expect(steps[0].title).toBe('Form');
    expect(steps[0].fields).toHaveLength(1);
  });

  it('handles missing fields gracefully', () => {
    const steps = getSteps(definition({ title: 'Empty' }));
    expect(steps[0].fields).toEqual([]);
  });
});

describe('component mapping', () => {
  it('has entries for all core field types', () => {
    const coreTypes = [
      'text',
      'email',
      'phone',
      'number',
      'password',
      'textarea',
      'select',
      'checkbox',
      'radio',
      'switch',
    ];
    for (const t of coreTypes) {
      expect(map.fields[t as keyof typeof map.fields]).toBeDefined();
    }
  });

  it('Forms Constructor variants use valid type names', () => {
    const validVariants = ['Input', 'Select', 'Textarea'];
    for (const [, cfg] of mappedFields) {
      if (cfg.formsConstructorVariant) {
        expect(validVariants).toContain(cfg.formsConstructorVariant);
      }
    }
  });

  it('standalone fields have a standaloneKey or are marked missing', () => {
    for (const [type, cfg] of mappedFields) {
      if (cfg.standalone) {
        expect(cfg.standaloneKey || cfg.missing).toBeTruthy();
      }
    }
  });
});
