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
  it('lists errors the engine rejects before warnings', () => {
    expect(checkDefinition(routed).map(({ severity, code, path }) => `${severity} ${code} ${path}`)).toEqual([
      'error route-target /steps/0/routes/0/to',
      'warning duplicate-key /steps/0/fields/1/key',
      'warning unknown-field /steps/0/fields/0/show/0/field',
    ]);
  });

  it('returns no issues for a valid definition', () => {
    expect(checkDefinition(clean)).toEqual([]);
  });

  it('accepts a form description', () => {
    expect(checkDefinition({ ...clean, description: 'Takes two minutes.' })).toEqual([]);
  });
});

describe.skipIf(!existsSync(iifePath) && !process.env.CI)('server IIFE checkDefinition', () => {
  it('is exposed on the Formhaus global', () => {
    const context: { Formhaus?: { checkDefinition: typeof checkDefinition } } = {};
    runInNewContext(readFileSync(iifePath, 'utf8'), context);
    expect(JSON.parse(JSON.stringify(context.Formhaus!.checkDefinition(routed)))).toEqual(checkDefinition(routed));
  });
});
