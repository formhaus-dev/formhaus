import { schemaValidate } from '@formhaus/core/schema';
import { describe, expect, it } from 'vitest';
import * as zod from 'zod';
import { compile } from '../compile';
import { demoFetch, errorsOf, load, problemOf } from './module';

const modules = { zod, '@formhaus/core/schema': { schemaValidate } };
const context = { fields: ['website', 'email'], submit: true };

async function module(source: string) {
  const compiled = await compile(source);
  if (!('code' in compiled)) throw new Error(compiled.problem.message);
  return load(compiled.code, modules);
}

describe('load', () => {
  it('uses an onValidate export as it is', async () => {
    const validate = await module("export const onValidate = (values: { a?: string }) => ({ email: 'Taken' });\n");
    expect(await validate({}, context)).toEqual({ email: 'Taken' });
  });

  it('wraps a schema export and its options with schemaValidate', async () => {
    const validate = await module(
      "import { z } from 'zod';\nexport const schema = z.object({ website: z.url('Enter a full address').optional() });\nexport const options = { emptyStrings: 'omit' };\n",
    );
    expect(await validate({ website: '' }, context)).toEqual({});
    expect(await validate({ website: 'foo' }, context)).toEqual({ website: 'Enter a full address' });
  });

  it('asks for an export when the module has neither', async () => {
    await expect(module('export const value = 1;\n')).rejects.toThrow('Export onValidate, or a Standard Schema as schema');
  });

  it('refuses a module outside the sandbox list', () => {
    expect(() => load("require('fs');", modules)).toThrow("Cannot find module 'fs'");
  });
});

describe('problemOf', () => {
  it('maps a runtime error to the line of the schema source', async () => {
    const error = await module("import { z } from 'zod';\n\nconst broken = missing.value;\n").catch((caught: unknown) => caught);
    expect(problemOf(error)).toEqual({ message: 'ReferenceError: missing is not defined', line: 3 });
  });

  it('keeps a plain error message and a thrown value', () => {
    expect(problemOf(new Error('Nope'))).toEqual({ message: 'Nope' });
    expect(problemOf('text')).toEqual({ message: 'text' });
  });
});

describe('errorsOf', () => {
  it('keeps string messages and passes empty results', () => {
    expect(errorsOf({ email: 'Taken', count: 2, '': 'Form' })).toEqual({ email: 'Taken', '': 'Form' });
    expect(errorsOf(null)).toEqual({});
    expect(errorsOf(undefined)).toEqual({});
  });
});

describe('demoFetch', () => {
  it('answers the email check and nothing else', async () => {
    expect((await demoFetch('/api/emails/taken%40example.com')).status).toBe(200);
    expect((await demoFetch('/api/emails/sam%40example.com')).status).toBe(404);
    await expect(demoFetch('https://example.com/steal')).rejects.toThrow('The playground has no network');
  });
});
