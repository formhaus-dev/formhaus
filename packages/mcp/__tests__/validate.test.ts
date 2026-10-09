import { describe, expect, it, vi } from 'vitest';
import { validateDefinitionTool } from '../src/validate';
import { branching, linear } from './fixtures';

describe('validate_definition', () => {
  it('accepts a valid definition', async () => {
    const report = await validateDefinitionTool({ definition: branching });
    expect(report).toMatchObject({ valid: true, errors: [], warnings: [] });
  });

  it('accepts a JSON string', async () => {
    const report = await validateDefinitionTool({ definition: JSON.stringify(linear) });
    expect(report.valid).toBe(true);
  });

  it('reports malformed JSON', async () => {
    const report = await validateDefinitionTool({ definition: '{ "id": ' });
    expect(report.valid).toBe(false);
    expect(report.errors[0]).toMatch(/not valid JSON/);
  });

  it('reports JSON Schema errors', async () => {
    const report = await validateDefinitionTool({ definition: { steps: [{ id: 's', fields: [{ key: 'a', colour: 'red' }] }] } });
    expect(report.valid).toBe(false);
    expect(report.errors).toEqual(expect.arrayContaining([
      "Schema: / must have required property 'id'",
      "Schema: / must have required property 'submit'",
      "Schema: /steps/0 must have required property 'title'",
      "Schema: /steps/0/fields/0 must have required property 'type'",
      'Schema: /steps/0/fields/0 must NOT have additional properties "colour"',
    ]));
  });

  it('reports wrong value types from the schema', async () => {
    const report = await validateDefinitionTool({ definition: { ...linear, steps: [{ ...linear.steps[0], routes: [{ to: 3 }] }] } });
    expect(report.errors).toContain('Schema: /steps/0/routes/0/to must be string,null');
  });

  it('rejects duplicate step ids without routes', async () => {
    const report = await validateDefinitionTool({ definition: { ...linear, steps: [linear.steps[0], { ...linear.steps[1], id: 'name' }] } });
    expect(report.valid).toBe(false);
    expect(report.errors).toEqual(['Duplicate step id "name" at steps[1].']);
  });

  it('rejects duplicate step ids with routes', async () => {
    const steps = [{ ...linear.steps[0], routes: [{ to: null }] }, { ...linear.steps[1], id: 'name' }];
    const report = await validateDefinitionTool({ definition: { ...linear, steps } });
    expect(report.errors).toEqual(['Duplicate step id "name" at steps[1].']);
  });

  it('returns unknown validator names as warnings without logging', async () => {
    const warn = vi.spyOn(console, 'warn');
    const fields = [{ key: 'a', type: 'text', label: 'A', validation: { validator: 'vat' } }];
    const report = await validateDefinitionTool({ definition: { id: 'x', title: 'X', submit: { label: 'Send' }, fields } });
    expect(report.warnings).toEqual(['Field "a" references unknown validator "vat".']);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns about next: false without an autoAdvance radio', async () => {
    const report = await validateDefinitionTool({ definition: { ...linear, steps: [{ ...linear.steps[0], next: false }, linear.steps[1]] } });
    expect(report.valid).toBe(true);
    expect(report.warnings).toContain('steps[0] has next: false but no autoAdvance radio, so users cannot move forward.');
  });

  it('reports route errors the engine rejects', async () => {
    const definition = { ...linear, steps: [{ ...linear.steps[0], routes: [{ to: 'missing' }] }, linear.steps[1]] };
    const report = await validateDefinitionTool({ definition });
    expect(report.valid).toBe(false);
    expect(report.errors.join('\n')).toMatch(/Invalid route from "name" to "missing"/);
  });

  it('reports structural errors next to schema errors', async () => {
    const definition = { ...linear, colour: 'blue', steps: [linear.steps[0], { ...linear.steps[1], id: 'name' }] };
    const report = await validateDefinitionTool({ definition });
    expect(report.errors.some((error) => error.startsWith('Schema:'))).toBe(true);
    expect(report.errors).toContain('Duplicate step id "name" at steps[1].');
  });

  it('rejects fields and steps together', async () => {
    const report = await validateDefinitionTool({ definition: { ...linear, fields: linear.steps[0].fields } });
    expect(report.errors).toContain('Definition cannot have both non-empty "fields" and "steps".');
  });

  it('returns core warnings for likely mistakes', async () => {
    const definition = {
      id: 'x', title: 'X', submit: { label: 'Send' },
      fields: [
        { key: 'a', type: 'text', label: 'A', show: [{ field: 'ghost', eq: 'yes' }] },
        { key: 'b', type: 'text', label: 'B', validation: { pattern: '[' } },
        { key: 'c', type: 'select', label: 'C' },
      ],
    };
    const report = await validateDefinitionTool({ definition });
    expect(report.valid).toBe(true);
    expect(report.warnings).toEqual(expect.arrayContaining([
      'Field "a" has show condition referencing non-existent field "ghost"',
      'Field "b" has invalid regex pattern: "["',
      'fields[2] of type "select" has no "options" or "optionsFrom".',
    ]));
  });
});
