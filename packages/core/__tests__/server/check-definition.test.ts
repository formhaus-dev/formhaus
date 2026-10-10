import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { checkDefinition } from '../../src/server';
import type { FormDefinition } from '../../src';

const iifePath = join(__dirname, '../../dist/server.iife.js');

const routed: FormDefinition = {
  id: 'routed',
  title: 'Routed',
  submit: { label: 'Submit' },
  steps: [
    {
      id: 'first',
      title: 'First',
      fields: [
        { key: 'name', type: 'text', label: 'Name', show: [{ field: 'missing', notEmpty: true }] },
        { key: 'name', type: 'text', label: 'Name again' },
      ],
      routes: [{ to: 'first' }],
    },
  ],
};

const clean: FormDefinition = {
  id: 'clean',
  title: 'Clean',
  submit: { label: 'Submit' },
  fields: [{ key: 'email', type: 'email', label: 'Email' }],
};

describe('checkDefinition', () => {
  it('splits errors the engine rejects from warnings', () => {
    const { errors, warnings } = checkDefinition(routed);
    expect(errors).toEqual(['Invalid route from "first" to "first": targets must be later steps or null.']);
    expect(warnings).toEqual([
      'Duplicate field key "name" — fields will share state and overwrite each other',
      'Field "name" has show condition referencing non-existent field "missing"',
    ]);
  });

  it('returns empty lists for a valid definition', () => {
    expect(checkDefinition(clean)).toEqual({ errors: [], warnings: [] });
  });
});

describe.skipIf(!existsSync(iifePath) && !process.env.CI)('server IIFE checkDefinition', () => {
  it('is exposed on the Formhaus global', () => {
    const context: { Formhaus?: { checkDefinition: typeof checkDefinition } } = {};
    runInNewContext(readFileSync(iifePath, 'utf8'), context);
    expect(JSON.parse(JSON.stringify(context.Formhaus!.checkDefinition(routed)))).toEqual(checkDefinition(routed));
  });
});
