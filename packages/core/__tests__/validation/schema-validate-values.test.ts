import * as v from 'valibot';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { FormEngine } from '../../src/engine';
import { schemaValidate, type StandardSchemaV1 } from '../../src/schema';
import type { FormDefinition } from '../../src/types';
import { league, leagueValues } from '../engine/validate.fixtures';

const signup: FormDefinition = {
  id: 'signup',
  title: 'Sign up',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'account',
      title: 'Account',
      fields: [
        { key: 'password', type: 'password', label: 'Password', validation: { required: true } },
        { key: 'confirm', type: 'password', label: 'Confirm', validation: { required: true } },
      ],
    },
    { id: 'profile', title: 'Profile', fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }] },
  ],
};

function recorder() {
  const seen: unknown[] = [];
  const schema: StandardSchemaV1 = {
    '~standard': {
      version: 1,
      vendor: 'test',
      validate: (value) => {
        seen.push(value);
        return { value };
      },
    },
  };
  return { seen, schema };
}

describe('schemaValidate empty strings', () => {
  const notes = z.object({ notes: z.string().min(3, 'Too short').optional() });

  it('passes a cleared field as an empty string by default', async () => {
    const form = new FormEngine(league, { ...leagueValues, notes: '' }, { onValidate: schemaValidate(notes) });
    await form.next();
    await form.next();
    expect(await form.submit(() => {})).toBe(false);
    expect(form.errors).toEqual({ notes: 'Too short' });
  });

  it('drops empty strings at the top level and in group items with emptyStrings omit', async () => {
    const { seen, schema } = recorder();
    const onSubmit = vi.fn();
    const values = { ...leagueValues, plan: '', notes: '', players: [{ name: 'Ada', role: '' }, { name: '' }] };
    const form = new FormEngine(league, values, { onValidate: schemaValidate(schema, { emptyStrings: 'omit' }) });
    await form.next();
    await form.next();
    expect(await form.submit(onSubmit)).toBe(true);
    expect(seen.at(-1)).toEqual({ email: 'ada@example.com', players: [{ name: 'Ada' }, {}] });
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({ plan: '', notes: '' });
  });

  it('lets a cleared optional field pass with emptyStrings omit', async () => {
    const form = new FormEngine(league, { ...leagueValues, notes: 'abc' }, { onValidate: schemaValidate(notes, { emptyStrings: 'omit' }) });
    form.setValue('notes', '');
    await form.next();
    await form.next();
    expect(await form.submit(() => {})).toBe(true);
  });

  it('keeps empty strings with emptyStrings keep', async () => {
    const { seen, schema } = recorder();
    await schemaValidate(schema, { emptyStrings: 'keep' })({ notes: '' }, { fields: ['notes'], submit: true });
    expect(seen).toEqual([{ notes: '' }]);
  });
});

describe('schemaValidate cross-field checks', () => {
  const continueWith = async (onValidate: ReturnType<typeof schemaValidate>) => {
    const form = new FormEngine(signup, { password: 'secret-1', confirm: 'secret-2' }, { onValidate });
    return { passed: await form.next(), errors: form.errors };
  };

  it('skips a Zod object refinement on Continue while a later step key is required', async () => {
    const schema = z
      .object({ password: z.string(), confirm: z.string(), name: z.string() })
      .refine((values) => values.confirm === values.password, { message: 'Passwords do not match', path: ['confirm'] });
    expect(await continueWith(schemaValidate(schema))).toEqual({ passed: true, errors: {} });
  });

  it.each([
    [
      'Zod with optional keys',
      z
        .object({ password: z.string().optional(), confirm: z.string().optional(), name: z.string().optional() })
        .refine((values) => values.confirm === values.password, { message: 'Passwords do not match', path: ['confirm'] }),
    ],
    [
      'Zod with when',
      z.object({ password: z.string(), confirm: z.string(), name: z.string() }).refine((values) => values.confirm === values.password, {
        message: 'Passwords do not match',
        path: ['confirm'],
        when: ({ value }) => z.object({ password: z.string(), confirm: z.string() }).safeParse(value).success,
      }),
    ],
    [
      'Valibot with partialCheck',
      v.pipe(
        v.object({ password: v.string(), confirm: v.string(), name: v.string() }),
        v.forward(
          v.partialCheck([['password'], ['confirm']], (values) => values.confirm === values.password, 'Passwords do not match'),
          ['confirm'],
        ),
      ),
    ],
  ])('runs the check on Continue: %s', async (_, schema) => {
    expect(await continueWith(schemaValidate(schema))).toEqual({ passed: false, errors: { confirm: 'Passwords do not match' } });
  });
});

describe('schemaValidate calls', () => {
  it('validates once per Continue and once per Submit', async () => {
    const { seen, schema } = recorder();
    const form = new FormEngine(signup, { password: 'secret-1', confirm: 'secret-1', name: 'Ada' }, { onValidate: schemaValidate(schema) });
    await form.next();
    expect(seen).toHaveLength(1);
    await form.submit(() => {});
    expect(seen).toHaveLength(2);
  });

  it('runs a Zod async refinement twice per check, inside Zod', async () => {
    const check = vi.fn(async () => true);
    const schema = z.object({ email: z.string().refine(check) });
    await schema['~standard'].validate({ email: 'ada@example.com' });
    expect(check).toHaveBeenCalledTimes(2);
    check.mockClear();
    await v.objectAsync({ email: v.pipeAsync(v.string(), v.checkAsync(check)) })['~standard'].validate({ email: 'ada@example.com' });
    expect(check).toHaveBeenCalledTimes(1);
  });
});
