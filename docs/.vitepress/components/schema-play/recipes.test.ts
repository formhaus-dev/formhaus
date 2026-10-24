import type { ValidateContext } from '@formhaus/core';
import { schemaValidate } from '@formhaus/core/schema';
import * as arktype from 'arktype';
import * as valibot from 'valibot';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as zod from 'zod';
import { compile } from './compile';
import { libraries, recipes, snippetOf, supports } from './recipes';
import { demoFetch, load } from './runtime/module';

const modules = { zod, valibot, arktype, '@formhaus/core/schema': { schemaValidate }, '@formhaus/core': {} };
const fields = (...keys: string[]): ValidateContext => ({ fields: keys, submit: true });

const failing: Record<string, { values: Record<string, unknown>; context: ValidateContext; keys: string[] }> = {
  players: {
    values: { email: 'sam@', players: [{ name: 'A' }, { name: 'Robin' }] },
    context: fields('email', 'players', 'players.0.name', 'players.1.name'),
    keys: ['email', 'players.0.name'],
  },
  empty: { values: { website: 'foo' }, context: fields('website'), keys: ['website'] },
  confirm: {
    values: { email: 'sam@example.com', password: '12345678', confirm: '1234' },
    context: { stepId: 'password', fields: ['password', 'confirm'], submit: true },
    keys: ['confirm'],
  },
  'server-check': { values: { email: 'taken@example.com' }, context: fields('email'), keys: ['email'] },
  'on-validate': {
    values: { players: [{ name: 'Sam' }, { name: 'sam' }, { name: 'Kim' }] },
    context: fields('players', 'players.0.name', 'players.1.name', 'players.2.name'),
    keys: ['players.1.name', ''],
  },
};

const cases = recipes.flatMap((recipe) =>
  libraries
    .filter((library) => supports(recipe, library.id) && (typeof recipe.snippets !== 'string' || library.id === 'zod'))
    .map((library) => [recipe.id, library.id] as const),
);

afterEach(() => vi.unstubAllGlobals());

describe('recipes', () => {
  it.each(cases)('%s with %s reports the failing keys', async (id, library) => {
    vi.stubGlobal('fetch', demoFetch);
    const recipe = recipes.find((entry) => entry.id === id)!;
    const compiled = await compile(snippetOf(recipe, library));
    if (!('code' in compiled)) throw new Error(compiled.problem.message);
    const validate = load(compiled.code, modules);
    const { values, context, keys } = failing[id]!;
    expect(Object.keys((await validate(values, context)) as object).sort()).toEqual([...keys].sort());
  });

  it('passes an emptied optional field with emptyStrings omit', async () => {
    for (const library of libraries) {
      const compiled = await compile(snippetOf(recipes.find((entry) => entry.id === 'empty')!, library.id));
      if (!('code' in compiled)) throw new Error(compiled.problem.message);
      expect(await load(compiled.code, modules)({ website: '' }, fields('website'))).toEqual({});
    }
  });
});
