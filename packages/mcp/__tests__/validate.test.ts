import { describe, expect, it, vi } from 'vitest';
import { validateDefinitionTool } from '../src/validate';
import { branching, linear } from './fixtures';

const summary = (definition: unknown) =>
  validateDefinitionTool({ definition }).issues.map(({ severity, code, path }) => `${severity} ${code} ${path}`);

const messages = (definition: unknown) =>
  validateDefinitionTool({ definition }).issues.map(({ severity, message }) => `${severity} ${message}`);

describe('validate_definition', () => {
  it('accepts a valid definition', () => {
    expect(validateDefinitionTool({ definition: branching })).toEqual({ valid: true, issues: [] });
  });

  it('accepts a JSON string', () => {
    expect(validateDefinitionTool({ definition: JSON.stringify(linear) }).valid).toBe(true);
  });

  it('reports malformed JSON', () => {
    const report = validateDefinitionTool({ definition: '{ "id": ' });
    expect(report.valid).toBe(false);
    expect(report.issues[0]).toMatchObject({ code: 'invalid-json', severity: 'error', path: '' });
    expect(report.issues[0].message).toMatch(/^\/: Definition is not valid JSON/);
  });

  it('reports schema and core issues with JSON pointers, without duplicates', () => {
    expect(messages({ steps: [{ id: 's', fields: [{ key: 'a', colour: 'red' }] }] })).toEqual([
      'error /: missing required property "id".',
      'error /: missing required property "title".',
      'error /: missing required property "submit".',
      'error /steps/0: missing required property "title".',
      'error /steps/0/fields/0: missing required property "label".',
      'error /steps/0/fields/0/colour: unknown property "colour". Remove "colour".',
      'error /steps/0/fields/0: missing required property "type".',
    ]);
  });

  it('reports a mistyped property as an error with a suggestion', () => {
    const definition = { imd: 'contact', title: 'Contact', submit: { label: 'Send' }, fields: [{ key: 'name', type: 'text', label: '' }] };
    const rename = { title: 'Rename "imd" to "id"', safe: true, patch: [{ op: 'move', from: '/imd', path: '/id' }] };
    expect(validateDefinitionTool({ definition })).toEqual({
      valid: false,
      issues: [
        { code: 'missing-property', severity: 'error', path: '', message: '/: missing required property "id".', fixes: [rename] },
        {
          code: 'unknown-property',
          severity: 'error',
          path: '/imd',
          message: '/imd: unknown property "imd". Did you mean "id"?',
          hint: 'Did you mean "id"?',
          fixes: [rename],
        },
        {
          code: 'empty-label',
          severity: 'warning',
          path: '/fields/0/label',
          message: '/fields/0/label: the label of "name" is empty. Add a label so screen readers can name the input.',
          hint: 'Add a label so screen readers can name the input.',
          fixes: [{ title: 'Set the label to "Name"', safe: true, patch: [{ op: 'add', path: '/fields/0/label', value: 'Name' }] }],
        },
      ],
    });
  });

  it('keeps properties the schema requires as errors', () => {
    const fields = [{ key: 'a', type: 'select', options: [{ value: 'x' }] }];
    expect(messages({ id: 'x', title: 'X', submit: { label: 'Go' }, fields })).toEqual([
      'error /fields/0: missing required property "label". Add a label so screen readers can name the input.',
      'error /fields/0/options/0: missing required property "label".',
    ]);
  });

  it('passes formatVersion through to core', () => {
    expect(summary({ ...linear, formatVersion: '1.0' })).toEqual([]);
    expect(summary({ ...linear, formatVersion: '2.0' })).toEqual(['error unsupported-format-version /formatVersion']);
    expect(summary({ ...linear, formatVersion: 'v1' })).toEqual(['error invalid-type /formatVersion']);
  });

  it('hints where a misplaced rule belongs', () => {
    const fields = [{ key: 'a', type: 'text', label: 'A', required: true }];
    const issue = validateDefinitionTool({ definition: { id: 'x', title: 'X', submit: { label: 'Go' }, fields } }).issues[0];
    expect(issue).toMatchObject({
      code: 'unknown-property',
      severity: 'error',
      path: '/fields/0/required',
      hint: 'Move "required" into "validation": { "required": ... }.',
    });
  });

  it('suggests an operator for an unknown condition key', () => {
    const fields = [
      { key: 'a', type: 'text', label: 'A' },
      { key: 'b', type: 'text', label: 'B', show: [{ field: 'a', equals: 'x' }] },
    ];
    const issues = validateDefinitionTool({ definition: { id: 'x', title: 'X', submit: { label: 'Go' }, fields } }).issues;
    expect(issues.map(({ code, path }) => `${code} ${path}`)).toEqual(['unknown-operator /fields/1/show/0/equals']);
    expect(issues[0].hint).toMatch(/^Use one of: "eq", "neq"/);
  });

  it('reports duplicate step ids and route errors from the engine', () => {
    expect(summary({ ...linear, steps: [linear.steps[0], { ...linear.steps[1], id: 'name' }] })).toEqual([
      'error duplicate-step-id /steps/1/id',
    ]);
    expect(summary({ ...linear, steps: [{ ...linear.steps[0], routes: [{ to: 'missing' }] }, linear.steps[1]] })).toEqual([
      'error route-target /steps/0/routes/0/to',
    ]);
  });

  it('returns unknown validator names as warnings without logging', () => {
    const warn = vi.spyOn(console, 'warn');
    const fields = [{ key: 'a', type: 'text', label: 'A', validation: { validator: 'vat' } }];
    expect(summary({ id: 'x', title: 'X', submit: { label: 'Send' }, fields })).toEqual([
      'warning unknown-validator /fields/0/validation/validator',
    ]);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns about next: false without an autoAdvance radio', () => {
    const report = validateDefinitionTool({ definition: { ...linear, steps: [{ ...linear.steps[0], next: false }, linear.steps[1]] } });
    expect(report.valid).toBe(true);
    expect(report.issues.map(({ code, path }) => `${code} ${path}`)).toEqual(['next-hidden /steps/0/next']);
  });

  it('rejects fields and steps together', () => {
    expect(summary({ ...linear, fields: linear.steps[0].fields })).toContain('error fields-and-steps ');
  });

  it('returns core warnings for likely mistakes', () => {
    const fields = [
      { key: 'a', type: 'text', label: 'A', validation: { min: 1 } },
      { key: 'c', type: 'select', label: 'C' },
    ];
    expect(summary({ id: 'x', title: 'X', submit: { label: 'Send' }, fields })).toEqual([
      'warning rule-not-applicable /fields/0/validation/min',
      'warning missing-options /fields/1/options',
    ]);
  });
});
