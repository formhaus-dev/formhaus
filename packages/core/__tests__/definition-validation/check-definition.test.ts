import { describe, expect, it } from 'vitest';
import { checkDefinition, validateDefinition } from '../../src';
import type { FormDefinition, FormField } from '../../src/types';

const form = (fields: FormField[]): FormDefinition => ({ id: 'f', title: 'F', submit: { label: 'Submit' }, fields });
const text = (key: string, extra: Partial<FormField> = {}): FormField => ({ key, type: 'text', label: key, ...extra });
const codes = (definition: unknown) => checkDefinition(definition).map(({ code, severity, path }) => `${severity} ${code} ${path}`);

function chain(length: number, closeCycle = false): FormDefinition {
  return form(
    Array.from({ length }, (_, index) =>
      text(
        `field-${index}`,
        index < length - 1
          ? { show: [{ field: `field-${index + 1}`, notEmpty: true }] }
          : closeCycle
            ? { show: [{ field: 'field-0', notEmpty: true }] }
            : {},
      ),
    ),
  );
}

describe('checkDefinition', () => {
  it('returns no issues for a valid definition', () => {
    expect(checkDefinition(form([text('name'), text('email', { type: 'email' })]))).toEqual([]);
  });

  it('rejects duplicate keys on one path with the path of the first declaration', () => {
    const definition: FormDefinition = {
      id: 'dup',
      title: 'Dup',
      submit: { label: 'Submit' },
      steps: [
        { id: 's1', title: 'S1', fields: [text('name')] },
        { id: 's2', title: 'S2', fields: [text('name')] },
      ],
    };
    expect(checkDefinition(definition)).toEqual([
      {
        code: 'duplicate-key',
        severity: 'error',
        path: '/steps/1/fields/0/key',
        message:
          '/steps/1/fields/0/key: key "name" is already used by /steps/0/fields/0 on the same path. Rename one of the fields, or move them to route branches that never meet.',
        hint: 'Rename one of the fields, or move them to route branches that never meet.',
      },
    ]);
  });

  it('rejects a repeated option value', () => {
    const plan = {
      key: 'plan',
      type: 'radio',
      label: 'Plan',
      options: [
        { value: 'pro', label: 'Pro' },
        { value: 'free', label: 'Free' },
        { value: 'pro', label: 'Team' },
      ],
    } as FormField;
    expect(checkDefinition(form([plan]))).toEqual([
      {
        code: 'duplicate-option-value',
        severity: 'error',
        path: '/fields/0/options/2/value',
        message: '/fields/0/options/2/value: "pro" is already an option value.',
      },
    ]);
  });

  it('rejects an invalid regex pattern', () => {
    expect(codes(form([text('code', { validation: { pattern: '[invalid(' } })]))).toEqual([
      'error invalid-pattern /fields/0/validation/pattern',
    ]);
  });

  it('handles a deep acyclic dependency chain', () => {
    expect(checkDefinition(chain(20_000))).toEqual([]);
  });

  it('reports the exact cycle at the end of a deep dependency chain', () => {
    const cycle = [...Array.from({ length: 20_000 }, (_, index) => `field-${index}`), 'field-0'];
    expect(checkDefinition(chain(20_000, true)).map((issue) => issue.message)).toEqual([
      `/fields/0: show conditions form a cycle: ${cycle.join(' -> ')}. Remove one of the conditions in the cycle.`,
    ]);
  });

  it('detects cycles that pass through step visibility', () => {
    const definition: FormDefinition = {
      id: 'step-cycle',
      title: 'Step cycle',
      submit: { label: 'Submit' },
      steps: [
        { id: 'main', title: 'Main', fields: [text('trigger', { show: [{ field: 'detail', notEmpty: true }] })] },
        { id: 'details', title: 'Details', show: [{ field: 'trigger', notEmpty: true }], fields: [text('detail')] },
      ],
    };
    expect(checkDefinition(definition).map((issue) => issue.message)).toContain(
      '/steps/0/fields/0: show conditions form a cycle: trigger -> detail -> trigger. Remove one of the conditions in the cycle.',
    );
  });

  it('suggests the closest key for a condition on an unknown field', () => {
    const definition = form([text('email'), text('name', { show: [{ field: 'emial', notEmpty: true }] })]);
    expect(checkDefinition(definition)[0].message).toBe('/fields/1/show/0/field: "emial" is not a field key. Use "email".');
  });

  it('keeps validateDefinition as a list of messages', () => {
    const definition = form([text('code', { validation: { pattern: '(' } })]);
    expect(validateDefinition(definition)).toEqual(checkDefinition(definition).map((issue) => issue.message));
  });

  it('lists errors before warnings', () => {
    const definition = form([text('a', { type: 'txt' }), text('b', { validation: { pattern: '(' } })]);
    expect(codes(definition)).toEqual(['error invalid-pattern /fields/1/validation/pattern', 'warning unknown-field-type /fields/0/type']);
  });
});
