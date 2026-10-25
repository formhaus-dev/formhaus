import { describe, expect, it } from 'vitest';
import { checkDefinition, FormEngine, type FormDefinition, type FormField } from '../../src';
import { validateSubmission } from '../../src/server';
import corpus from './real-world-patterns.json';

const form = (...patterns: string[]): FormDefinition => ({
  id: 'patterns',
  title: 'Patterns',
  submit: { label: 'Send' },
  fields: patterns.map((pattern, index): FormField => ({ key: `p${index}`, type: 'text', label: `P${index}`, validation: { pattern } })),
});

const valuesOf = (values: string[]) => Object.fromEntries(values.map((value, index) => [`p${index}`, value]));
const keys = (count: number) => Array.from({ length: count }, (_, index) => `p${index}`);

describe('patterns on the server', () => {
  it('runs every pattern of a corpus of real-world patterns', () => {
    const definition = form(...corpus.map(({ pattern }) => pattern));
    expect(validateSubmission(definition, valuesOf(corpus.map(({ valid }) => valid))).errors).toEqual({});
    expect(Object.keys(validateSubmission(definition, valuesOf(corpus.map(({ invalid }) => invalid))).errors)).toEqual(keys(corpus.length));
  });

  it('runs a pattern that checkDefinition reports as slow', () => {
    const patterns = ['^(a+)+$', '^(\\w+\\s?)+$', "^[A-Za-z]+(?:[ '-]?[A-Za-z]+)*$", '^\\d+\\d+$', `^(?:${'a'.repeat(1000)})$`];
    const definition = form(...patterns);
    expect(checkDefinition(definition).map(({ code, severity }) => `${code} ${severity}`)).toEqual(
      patterns.map(() => 'slow-pattern warning'),
    );
    expect(validateSubmission(definition, valuesOf(['aaa', 'Ada Lovelace', "Mary O'Neil", '12', 'a'.repeat(1000)])).errors).toEqual({});
    expect(Object.keys(validateSubmission(definition, valuesOf(['aab', 'Ada!', 'Mary--Jane', '1', 'a'])).errors)).toEqual(keys(5));
  });

  it('runs a slow pattern inside a group', () => {
    const definition: FormDefinition = {
      ...form(),
      formatVersion: '1.1',
      fields: [
        {
          key: 'people',
          type: 'group',
          label: 'People',
          fields: [{ key: 'name', type: 'text', label: 'Name', validation: { pattern: '^(\\w+\\s?)+$' } }],
        },
      ],
    };
    expect(validateSubmission(definition, { people: [{ name: 'Ada Lovelace' }] }).errors).toEqual({});
    expect(validateSubmission(definition, { people: [{ name: 'Ada!' }] }).errors).toEqual({ 'people.0.name': 'Invalid format' });
  });

  it('matches the browser engine on a slow pattern', () => {
    const definition = form('^\\d+\\.?\\d*$');
    const long = '1'.repeat(1001);
    expect(validateSubmission(definition, { p0: long }).errors).toEqual({});
    expect(new FormEngine(definition, { p0: long }, { onWarning: () => {} }).validate()).toEqual({});
  });
});
