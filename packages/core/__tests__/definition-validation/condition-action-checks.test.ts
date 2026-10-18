import { describe, expect, it } from 'vitest';
import { checkDefinition, FormEngine } from '../../src';
import type { FormDefinition, FormField } from '../../src/types';

const form = (fields: FormField[]): FormDefinition => ({ id: 'f', title: 'F', submit: { label: 'Submit' }, fields });

const field = (key: string, extra: Partial<FormField> = {}): FormField => ({ key, type: 'text', label: key, ...extra });

const codes = (definition: unknown) => checkDefinition(definition).map(({ code, severity, path }) => `${severity} ${code} ${path}`);

describe('condition, action and props checks', () => {
  it('warns that notEmpty: false always matches', () => {
    const definition = form([
      field('a'),
      field('b', { show: [{ field: 'a', notEmpty: false }] }),
      field('c', { show: [{ field: 'a', notEmpty: true }] }),
    ]);
    expect(codes(definition)).toEqual(['warning condition-always-true /fields/1/show/0/notEmpty']);
    expect(checkDefinition(definition)[0].message).toBe(
      '/fields/1/show/0/notEmpty: "notEmpty": false matches every value. Use "notEmpty": true, or remove the condition.',
    );
  });

  it.each([null, [], 42, 'stars', new Date(0)])('rejects props %j that is not an object', (props) => {
    const definition = form([field('a', { type: 'x-rating', props: props as never })]);
    expect(codes(definition)).toEqual(['error invalid-type /fields/0/props']);
    expect(() => new FormEngine(definition)).toThrow('/fields/0/props: must be an object');
  });
});
