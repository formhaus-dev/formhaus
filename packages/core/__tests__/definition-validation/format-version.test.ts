import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { describe, expect, it } from 'vitest';
import { checkDefinition, FORMAT_VERSION, FormDefinitionError, FormEngine } from '../../src';
import { validateSubmission } from '../../src/server';

const base = { id: 'a', title: 'A', submit: { label: 'Go' }, fields: [{ key: 'name', type: 'text', label: 'Name' }] };
const schema = JSON.parse(readFileSync(resolve(__dirname, '../../schema/form-definition.schema.json'), 'utf8'));
const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);
const errors = (input: unknown) => checkDefinition(input).map(({ code, path, message }) => ({ code, path, message }));

describe('formatVersion', () => {
  it('reads definitions without a format version', () => {
    expect(errors(base)).toEqual([]);
    expect(validate(base)).toBe(true);
  });

  it.each(['1', '1.0', '1.4', FORMAT_VERSION])('accepts %s', (formatVersion) => {
    const definition = { formatVersion, ...base };
    expect(errors(definition)).toEqual([]);
    expect(validate(definition)).toBe(true);
    expect(new FormEngine(definition).definition.formatVersion).toBe(formatVersion);
  });

  it.each(['2', '2.0', '10.1'])('reports %s as unsupported', (formatVersion) => {
    const definition = { formatVersion, ...base, fields: 'ignored' };
    expect(checkDefinition(definition)).toEqual([
      {
        code: 'unsupported-format-version',
        severity: 'error',
        path: '/formatVersion',
        message: `/formatVersion: format ${formatVersion} is not supported. Upgrade @formhaus/core.`,
        hint: 'Upgrade @formhaus/core.',
      },
    ]);
    expect(validate({ ...definition, fields: [] })).toBe(true);
    expect(() => new FormEngine(definition as never)).toThrow(FormDefinitionError);
    expect(() => validateSubmission(definition as never, {})).toThrow(FormDefinitionError);
  });

  it.each([1, '', 'v1', '1.0.0', '0.9', '1.', null])('reports %j as invalid-type', (formatVersion) => {
    const definition = { formatVersion, ...base };
    expect(errors(definition)).toEqual([
      { code: 'invalid-type', path: '/formatVersion', message: '/formatVersion: must be a version string. Use "1.0".' },
    ]);
    expect(validate(definition)).toBe(false);
  });
});
