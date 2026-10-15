import { fromDefinition, toDefinition } from '@formhaus/builder';
import { checkDefinition, type FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { formatDefinition, parseJson, sameDefinition } from './sync';

const load = (definition: FormDefinition) => fromDefinition(definition);
const definition: FormDefinition = {
  id: 'contact',
  title: 'Contact',
  submit: { label: 'Send' },
  fields: [{ key: 'email', type: 'email', label: 'Email' }],
};

describe('parseJson', () => {
  it('loads a valid definition into a builder form', () => {
    const parsed = parseJson(JSON.stringify(definition), load);
    if ('error' in parsed) throw new Error(parsed.error.message);
    expect(toDefinition(parsed.form).fields?.[0]).toMatchObject({ key: 'email', type: 'email' });
  });

  it('points at the line of a syntax error', () => {
    const parsed = parseJson('{\n  "title": "A",\n  "fields": [\n}', load);
    expect('error' in parsed && parsed.error.line).toBe(4);
  });

  it('rejects JSON that is not an object', () => {
    expect(parseJson('[1, 2]', load)).toMatchObject({ error: { message: 'The definition must be a JSON object' } });
  });

  it('reports definition problems without failing', () => {
    const parsed = parseJson(JSON.stringify({ ...definition, fields: [...(definition.fields ?? []), ...(definition.fields ?? [])] }), load);
    expect('definition' in parsed && checkDefinition(parsed.definition).length).toBeGreaterThan(0);
  });
});

describe('formatDefinition', () => {
  it('round-trips through parseJson to the same definition', () => {
    const form = load(definition);
    const parsed = parseJson(formatDefinition(form), load);
    if ('error' in parsed) throw new Error(parsed.error.message);
    expect(sameDefinition(parsed.form, form)).toBe(true);
  });
});
