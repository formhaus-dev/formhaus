import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { checkDefinition, FormDefinitionError, FormEngine } from '../../src';
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

  it('reports a condition on a section key as unknown-field', () => {
    expect(codes(form([section('billing', [text('street')]), text('b', { show: [{ field: 'billing', notEmpty: true }] })]))).toEqual([
      'error unknown-field /fields/1/show/0/field',
    ]);
  });

  it('reports a section condition on its own field as a cycle', () => {
    expect(codes(form([section('billing', [text('street')], { show: [{ field: 'street', notEmpty: true }] })]))).toEqual([
      'error condition-cycle /fields/0/fields/0',
    ]);
  });

  it('applies the step rules to section conditions', () => {
    const definition: FormDefinition = {
      formatVersion: '1.1',
      id: 'f',
      title: 'F',
      submit: { label: 'Go' },
      steps: [
        { id: 'one', title: 'One', fields: [section('billing', [text('street')], { show: [{ field: 'later', notEmpty: true }] })] },
        { id: 'two', title: 'Two', fields: [text('later')] },
      ],
    };
    expect(codes(definition)).toEqual(['error forward-reference /steps/0/fields/0/show/0/field']);
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

  it('lets item fields use sibling fields and outer fields, but not fields of another group', () => {
    const definition = form([
      text('country'),
      group('a', [
        text('x'),
        text('y', {
          show: [
            { field: 'x', notEmpty: true },
            { field: 'country', eq: 'NL' },
          ],
          validation: { matchField: 'x' },
        }),
      ]),
      group('b', [text('z', { show: [{ field: 'x', notEmpty: true }] })]),
    ]);
    expect(codes(definition)).toEqual(['error group-scope /fields/2/fields/0/show/0/field']);
  });

  it('reports cycles inside an item', () => {
    expect(
      codes(
        form([group('a', [text('x', { show: [{ field: 'y', notEmpty: true }] }), text('y', { show: [{ field: 'x', notEmpty: true }] })])]),
      ),
    ).toEqual(['error condition-cycle /fields/0/fields/0']);
  });

  it('keeps item keys unique and apart from outer keys and group paths', () => {
    expect(
      codes(form([text('name'), section('people.0', [text('people.1.x')]), group('people', [text('name'), text('a'), text('a')])])),
    ).toEqual([
      'error duplicate-key /fields/1/key',
      'error duplicate-key /fields/1/fields/0/key',
      'error duplicate-key /fields/2/fields/0/key',
      'error duplicate-key /fields/2/fields/2/key',
    ]);
    expect(codes(form([section('dup', [text('x')]), text('dup')]))).toEqual(['error duplicate-key /fields/1/key']);
    expect(codes(form([group('a', [text('x')]), group('b', [text('x')])]))).toEqual([]);
  });

  it('rejects nested containers and file or hidden fields in a group', () => {
    expect(
      codes(
        form([
          section('outer', [section('inner', [text('a')]) as never]),
          group('g', [
            group('h', [text('b')]) as never,
            text('f', { type: 'file' }),
            text('secret', { type: 'hidden' }),
            section('s', [text('c')]) as never,
          ]),
        ]),
      ),
    ).toEqual([
      'error invalid-nesting /fields/0/fields/0/type',
      'error invalid-nesting /fields/1/fields/0/type',
      'error invalid-nesting /fields/1/fields/1/type',
      'error invalid-nesting /fields/1/fields/2/type',
      'error invalid-nesting /fields/1/fields/3/type',
    ]);
  });

  it('checks the shape of containers', () => {
    expect(
      codes(
        form([
          { key: 's', type: 'section', title: 'S' } as never,
          { key: 'g', type: 'group', label: 1, fields: 'x', defaultItems: 'two' } as never,
        ]),
      ),
    ).toEqual([
      'error missing-property /fields/0',
      'error invalid-type /fields/1/label',
      'error invalid-type /fields/1/defaultItems',
      'error invalid-type /fields/1/fields',
    ]);
  });

  it('reports defaultItems above maxLength', () => {
    expect(codes(form([group('g', [text('a')], { defaultItems: 3, validation: { maxLength: 2 } })]))).toEqual([
      'error invalid-range /fields/0/defaultItems',
    ]);
  });

  it('warns when a definition with containers does not declare format 1.1', () => {
    const definition = { ...form([section('s', [text('a')])]), formatVersion: undefined };
    expect(codes(definition)).toEqual(['warning outdated-format-version /formatVersion']);
    expect(codes({ ...definition, formatVersion: '1.0' })).toEqual(['warning outdated-format-version /formatVersion']);
    expect(codes({ ...definition, formatVersion: '1.2' })).toEqual([]);
  });

  it('warns about min and max on a group', () => {
    expect(codes(form([group('g', [text('a')], { validation: { min: 1 } as never })]))).toEqual([
      'warning rule-not-applicable /fields/0/validation/min',
    ]);
  });

  it('throws from the engine on scope errors', () => {
    expect(() => new FormEngine(form([group('g', [text('a')]), text('b', { show: [{ field: 'a', notEmpty: true }] })]))).toThrow(
      FormDefinitionError,
    );
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
