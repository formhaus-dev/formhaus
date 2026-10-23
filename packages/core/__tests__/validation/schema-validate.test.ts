import { type } from 'arktype';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { FormEngine } from '../../src/engine';
import { schemaValidate, type StandardSchemaV1 } from '../../src/schema';
import { league, leagueValues } from '../engine/validate.fixtures';

const taken = async (email: unknown) => email !== 'taken@example.com';

const schemas: Record<string, { sync: StandardSchemaV1; async: StandardSchemaV1 }> = {
  zod: {
    sync: z
      .object({
        email: z.email('Enter a valid email'),
        players: z.array(z.object({ name: z.string().min(1, 'Name the player') })).optional(),
        notes: z.string().max(5, 'Too long').optional(),
      })
      .refine((values) => values.players?.length !== 1, 'Add a second player'),
    async: z.object({ email: z.string().refine(taken, 'Already registered') }),
  },
  valibot: {
    sync: v.pipe(
      v.object({
        email: v.pipe(v.string(), v.email('Enter a valid email')),
        players: v.optional(v.array(v.object({ name: v.pipe(v.string(), v.minLength(1, 'Name the player')) }))),
        notes: v.optional(v.pipe(v.string(), v.maxLength(5, 'Too long'))),
      }),
      v.check((values) => values.players?.length !== 1, 'Add a second player'),
    ),
    async: v.objectAsync({ email: v.pipeAsync(v.string(), v.checkAsync(taken, 'Already registered')) }),
  },
};

describe.each(Object.entries(schemas))('schemaValidate with %s', (_, schema) => {
  const engine = (values: Record<string, unknown>, async = false) =>
    new FormEngine(league, values, { onValidate: schemaValidate(async ? schema.async : schema.sync) });

  it('maps issues of the step and drops issues of other steps', async () => {
    const form = engine({ ...leagueValues, email: 'nope', notes: 'Far too long' });
    expect(await form.next()).toBe(false);
    expect(form.errors).toEqual({ email: 'Enter a valid email' });
  });

  it('passes a step when only other steps have issues', async () => {
    expect(await engine({ ...leagueValues, notes: 'Far too long' }).next()).toBe(true);
  });

  it('maps nested paths to group item keys', async () => {
    const form = engine(leagueValues);
    await form.next();
    expect(await form.next()).toBe(false);
    expect(form.errors).toEqual({ 'players.1.name': 'Name the player' });
  });

  it('maps every group item', async () => {
    const form = engine({ ...leagueValues, players: [{ name: '' }, { name: '' }] });
    await form.next();
    await form.next();
    expect(form.errors).toEqual({ 'players.0.name': 'Name the player', 'players.1.name': 'Name the player' });
  });

  it('shows a path-less issue as a top-level error on submit', async () => {
    const form = engine({ ...leagueValues, players: [{ name: 'Ada' }] });
    await form.next();
    await form.next();
    expect(await form.submit(() => {})).toBe(false);
    expect(form.errors).toEqual({});
    expect(form.topLevelErrors).toEqual(['Add a second player']);
  });

  it('runs an async check', async () => {
    const form = engine({ ...leagueValues, email: 'taken@example.com' }, true);
    expect(await form.next()).toBe(false);
    expect(form.errors).toEqual({ email: 'Already registered' });
    expect(await engine(leagueValues, true).next()).toBe(true);
  });
});

describe('schemaValidate', () => {
  it('works with ArkType', async () => {
    const form = new FormEngine(league, { ...leagueValues, plan: 'x' }, { onValidate: schemaValidate(type({ plan: 'string >= 2' })) });
    expect(await form.next()).toBe(false);
    expect(Object.keys(form.errors)).toEqual(['plan']);
  });

  it('maps a deeper path to the closest field in scope, drops hidden group item fields and keeps the first message per field', async () => {
    const issues = [
      { message: 'Pick fewer', path: ['plan', { key: 0 }] },
      { message: 'Unknown plan', path: [{ key: 'plan' }] },
      { message: 'Not here', path: ['ghost'] },
      { message: 'Hidden role', path: ['players', 1, 'role'] },
      { message: 'Unknown item', path: ['players', { key: 0 }, { key: 'nickname' }] },
    ];
    const schema: StandardSchemaV1 = { '~standard': { version: 1, vendor: 'test', validate: () => ({ issues }) } };
    const form = new FormEngine(league, leagueValues, { onValidate: schemaValidate(schema) });
    expect(await form.next()).toBe(false);
    expect(form.errors).toEqual({ plan: 'Pick fewer' });
    expect(form.topLevelErrors).toEqual([]);
    expect(await form.submit(() => {})).toBe(false);
    expect(form.errors).toEqual({ plan: 'Pick fewer' });
    expect(form.topLevelErrors).toEqual([]);
  });
});
