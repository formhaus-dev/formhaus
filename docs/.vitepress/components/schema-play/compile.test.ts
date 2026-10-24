import { describe, expect, it } from 'vitest';
import { compile } from './compile';

describe('compile', () => {
  it('strips types, turns imports into require and lists the libraries', async () => {
    const result = await compile(
      "import type { ValidateFn } from '@formhaus/core';\nimport * as v from 'valibot';\nexport const schema: unknown = v.string();\n",
    );
    expect(result).toMatchObject({ libraries: ['valibot'] });
    expect('code' in result && result.code).toContain("require('valibot')");
  });

  it('calls imported functions without .call so ArkType type() works', async () => {
    const result = await compile("import { type } from 'arktype';\nexport const schema = type({ a: 'string' });\n");
    expect('code' in result && result.code).toContain('(0, _arktype.type)({');
  });

  it('reports a syntax error with its line', async () => {
    expect(await compile("import { z } from 'zod';\n\nexport const schema = z.object(;\n")).toEqual({
      problem: { message: 'Unexpected token', line: 3 },
    });
  });

  it('rejects a module the playground does not have', async () => {
    const result = await compile("import { z } from 'zod';\nimport yup from 'yup';\nexport const schema = yup.string() ?? z.string();\n");
    expect(result).toEqual({
      problem: { message: "Cannot import 'yup'. Import from zod, valibot, arktype or @formhaus/core/schema.", line: 2 },
    });
  });
});
