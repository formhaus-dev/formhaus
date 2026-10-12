import { describe, expect, it, vi } from 'vitest';
import { validateDefinitionTool } from '../src/validate';
import { branching, linear } from './fixtures';

const summary = (definition: unknown) => validateDefinitionTool({ definition }).issues.map(({ severity, code, path }) => `${severity} ${code} ${path}`);

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
    expect(summary({ steps: [{ id: 's', fields: [{ key: 'a', colour: 'red' }] }] })).toEqual([
      'error schema /id',
      'error schema /title',
      'error schema /submit',
      'error schema /steps/0/title',
      'error schema /steps/0/fields/0/label',
      'error schema /steps/0/fields/0/colour',
      'error missing-property /steps/0/fields/0/type',
    ]);
  });

  it('hints where a misplaced rule belongs', () => {
    const fields = [{ key: 'a', type: 'text', label: 'A', required: true }];
    const issue = validateDefinitionTool({ definition: { id: 'x', title: 'X', submit: { label: 'Go' }, fields } }).issues[0];
    expect(issue).toMatchObject({ code: 'schema', path: '/fields/0/required', hint: 'Move "required" into "validation": { "required": ... }.' });
  });

  it('suggests an operator for an unknown condition key', () => {
    const fields = [{ key: 'a', type: 'text', label: 'A' }, { key: 'b', type: 'text', label: 'B', show: [{ field: 'a', equals: 'x' }] }];
    const issues = validateDefinitionTool({ definition: { id: 'x', title: 'X', submit: { label: 'Go' }, fields } }).issues;
    expect(issues.map(({ code, path }) => `${code} ${path}`)).toEqual(['unknown-operator /fields/1/show/0/equals']);
    expect(issues[0].hint).toMatch(/^Use one of: "eq", "neq"/);
  });

  it('reports duplicate step ids and route errors from the engine', () => {
    expect(summary({ ...linear, steps: [linear.steps[0], { ...linear.steps[1], id: 'name' }] })).toEqual(['error duplicate-step-id /steps/1/id']);
    expect(summary({ ...linear, steps: [{ ...linear.steps[0], routes: [{ to: 'missing' }] }, linear.steps[1]] })).toEqual(['error route-target /steps/0/routes/0/to']);
  });

  it('returns unknown validator names as warnings without logging', () => {
    const warn = vi.spyOn(console, 'warn');
    const fields = [{ key: 'a', type: 'text', label: 'A', validation: { validator: 'vat' } }];
    expect(summary({ id: 'x', title: 'X', submit: { label: 'Send' }, fields })).toEqual(['warning unknown-validator /fields/0/validation/validator']);
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
    const fields = [{ key: 'a', type: 'text', label: 'A', validation: { min: 1 } }, { key: 'c', type: 'select', label: 'C' }];
    expect(summary({ id: 'x', title: 'X', submit: { label: 'Send' }, fields })).toEqual([
      'warning rule-not-applicable /fields/0/validation/min',
      'warning missing-options /fields/1/options',
    ]);
  });
});
