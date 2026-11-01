import { type } from 'arktype';
import * as v from 'valibot';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { z } from 'zod';
import { FormEngine, type FormDefinition } from '../../src';
import { schemaParse, type StandardSchemaV1 } from '../../src/schema';

const definition: FormDefinition = {
  id: 'seats',
  title: 'Seats',
  submit: { label: 'Save' },
  fields: [
    { key: 'email', type: 'text', label: 'Email' },
    { key: 'seats', type: 'text', label: 'Seats' },
  ],
};

const schemas: Record<string, StandardSchemaV1> = {
  zod: z.object({
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
    seats: z.coerce.number().int('Whole seats only'),
    plan: z.string().catch('free'),
  }),
  valibot: v.object({
    email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email('Enter a valid email')),
    seats: v.pipe(v.string(), v.transform(Number), v.integer('Whole seats only')),
    plan: v.fallback(v.string(), 'free'),
  }),
  arktype: type({
    email: type('string').pipe((value) => value.trim().toLowerCase(), type('string.email').configure({ message: 'Enter a valid email' })),
    seats: type('string.integer.parse').configure({ message: 'Whole seats only' }),
    plan: type('string').default('free'),
  }),
};

describe.each(Object.entries(schemas))('schemaParse with %s', (_, schema) => {
  const run = (values: Record<string, unknown>) => {
    const parsed = schemaParse(schema);
    const handler = vi.fn();
    const engine = new FormEngine(definition, values, { onValidate: parsed.validate });
    return { engine, handler, submit: () => engine.submit(parsed.submit(handler)) };
  };

  it('passes the schema output to the handler', async () => {
    const { handler, submit } = run({ email: 'Ada@Example.com', seats: '3' });
    expect(await submit()).toBe(true);
    expect(handler).toHaveBeenCalledWith({ email: 'ada@example.com', seats: 3, plan: 'free' }, []);
  });

  it('maps issues to fields and does not call the handler', async () => {
    const { engine, handler, submit } = run({ email: 'nope', seats: '2.5' });
    expect(await submit()).toBe(false);
    expect(handler).not.toHaveBeenCalled();
    expect(engine.errors).toEqual({ email: 'Enter a valid email', seats: expect.any(String) });
  });
});

describe('schemaParse', () => {
  const schema = z.object({ email: z.string().transform((value) => value.toUpperCase()), seats: z.coerce.number() });

  it('types the handler values as the schema output', () => {
    schemaParse(schema).submit((values) => {
      expectTypeOf(values).toEqualTypeOf<{ email: string; seats: number }>();
    });
  });

  it('validates again when the submitted values were not validated', async () => {
    const handler = vi.fn();
    const parsed = schemaParse(schema);
    await parsed.submit(handler)({ email: 'ada', seats: '4' }, ['extra']);
    expect(handler).toHaveBeenCalledWith({ email: 'ADA', seats: 4 }, ['extra']);
    expect(await parsed.submit(handler)({ email: 1, seats: '2' }, [])).toEqual({ ok: false, errors: { email: expect.any(String) } });
  });

  it('runs the schema once per submit', async () => {
    const validate = vi.fn(schema['~standard'].validate);
    const counted = { '~standard': { ...schema['~standard'], validate } } as typeof schema;
    const parsed = schemaParse(counted);
    const engine = new FormEngine(definition, { email: 'ada', seats: '1' }, { onValidate: parsed.validate });
    expect(await engine.submit(parsed.submit(() => {}))).toBe(true);
    expect(validate).toHaveBeenCalledTimes(1);
  });

  it('runs the schema once when onBeforeSubmit leaves the values equal', async () => {
    const validate = vi.fn(schema['~standard'].validate);
    const counted = { '~standard': { ...schema['~standard'], validate } } as typeof schema;
    const parsed = schemaParse(counted);
    const handler = vi.fn();
    const engine = new FormEngine(definition, { email: 'ada', seats: '1' }, { onValidate: parsed.validate, onBeforeSubmit: () => true });
    expect(await engine.submit(parsed.submit(handler))).toBe(true);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ email: 'ADA', seats: 1 }, []);
  });

  it('shows a form error and warns when the schema rejects a field the form does not submit', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const company: FormDefinition = {
      id: 'company',
      title: 'Company',
      submit: { label: 'Save' },
      fields: [
        { key: 'business', type: 'checkbox', label: 'Business' },
        { key: 'vat', type: 'text', label: 'VAT', show: [{ field: 'business', eq: true }] },
      ],
    };
    const validate = vi.fn(z.object({ vat: z.string('VAT is required') })['~standard'].validate);
    const parsed = schemaParse({ '~standard': { version: 1, vendor: 'zod', validate } });
    const handler = vi.fn();
    const engine = new FormEngine(company, { business: false, vat: 'DE1' }, { onValidate: parsed.validate });
    expect(await engine.submit(parsed.submit(handler))).toBe(false);
    expect(engine.topLevelErrors).toEqual(['VAT is required']);
    expect(handler).not.toHaveBeenCalled();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mark them optional'));
    warn.mockRestore();
  });
});
