import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { checkDefinition, FormDefinitionError } from '../../src';
import { suggestFixes } from '../../src/fix';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormField, FormGroup, FormNode, FormSection } from '../../src/types';

const schema = JSON.parse(readFileSync(resolve(__dirname, '../../schema/form-definition.schema.json'), 'utf8'));
const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);

const form = (fields: FormNode[]): FormDefinition => ({ formatVersion: '1.1', id: 'f', title: 'F', submit: { label: 'Submit' }, fields });
const text = (key: string, extra: Partial<FormField> = {}): FormField => ({ key, type: 'text', label: key, ...extra });
const section = (key: string, fields: (FormField | FormGroup)[], extra: Partial<FormSection> = {}): FormSection => ({
  key,
  type: 'section',
  title: key,
  fields,
  ...extra,
});
const group = (key: string, fields: FormField[], extra: Partial<FormGroup> = {}): FormGroup => ({
  key,
  type: 'group',
  label: key,
  fields,
  ...extra,
});
const codes = (definition: unknown) => checkDefinition(definition).map(({ code, severity, path }) => `${severity} ${code} ${path}`);

describe('sections and groups in checkDefinition', () => {
  it('accepts a section and a group with scoped conditions', () => {
    const definition = form([
      text('invoice'),
      section('billing', [text('street'), group('people', [text('name'), text('note', { show: [{ field: 'name', notEmpty: true }] })])], {
        show: [{ field: 'invoice', notEmpty: true }],
      }),
      text('summary', { show: [{ field: 'people', notEmpty: true }] }),
    ]);
    expect(codes(definition)).toEqual([]);
    expect(validate(definition), JSON.stringify(validate.errors)).toBe(true);
  });

  it('reports outer conditions and matchField on item fields as group-scope', () => {
    const definition = form([
      group('people', [text('email')]),
      text('a', { show: [{ field: 'email', notEmpty: true }] }),
      text('b', { validation: { matchField: 'email' } }),
    ]);
    expect(checkDefinition(definition).map(({ code, path, message }) => [code, path, message])).toEqual([
      [
        'group-scope',
        '/fields/1/show/0/field',
        '/fields/1/show/0/field: "email" is a field inside the group "people". Only fields of the same group can use it.',
      ],
      ['group-scope', '/fields/2/validation/matchField', expect.stringContaining('inside the group "people"')],
    ]);
  });

  it('rejects unknown properties on containers in the JSON Schema', () => {
    expect(validate(form([section('s', [text('a')], { label: 'x' } as never)]))).toBe(false);
    expect(validate(form([group('g', [text('a')], { placeholder: 'x' } as never)]))).toBe(false);
    expect(validate(form([group('g', [text('a')], { defaultItems: 1.5 })]))).toBe(false);
    expect(validate(form([group('g', [text('a')], { validation: { pattern: 'x' } as never })]))).toBe(false);
    expect(validate(form([text('a', { fields: [] } as never)]))).toBe(false);
  });
});

describe('deeply nested definitions', () => {
  const nested = (type: 'section' | 'group', depth: number): FormDefinition => {
    const fields: unknown[] = [];
    let level = fields;
    for (let index = 0; index < depth; index++) {
      const children: unknown[] = [];
      level.push({ key: `n${index}`, type, ...(type === 'group' ? { label: 'N' } : { title: 'N' }), fields: children });
      level = children;
    }
    return form(fields as FormNode[]);
  };

  it('reports invalid nesting at depth 5000 instead of overflowing the stack', () => {
    for (const type of ['section', 'group'] as const) {
      const definition = nested(type, 5000);
      expect(checkDefinition(definition).map(({ code, path }) => `${code} ${path}`)).toEqual([
        `invalid-nesting /fields/0/fields/0/type`,
        `invalid-nesting /fields/0/fields/0/fields/0/type`,
      ]);
      expect(suggestFixes(definition)).toHaveLength(2);
      expect(() => validateSubmission(definition, {})).toThrow(FormDefinitionError);
    }
  });
});
