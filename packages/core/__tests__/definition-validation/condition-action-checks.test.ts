import { describe, expect, it } from 'vitest';
import { checkDefinition } from '../../src';
import type { FormDefinition, FormField } from '../../src/types';

const form = (fields: FormField[], extra: Partial<FormDefinition> = {}): FormDefinition => ({
  id: 'f',
  title: 'F',
  submit: { label: 'Submit' },
  fields,
  ...extra,
});

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

  it('warns about disabled on Back, Skip and Cancel only', () => {
    const disabled = [{ field: 'a', eq: 'x' }];
    const definition = form([], {
      cancel: { label: 'Cancel', disabled },
      submit: { label: 'Submit', disabled },
      fields: undefined,
      steps: [
        { id: 's1', title: 'S1', fields: [field('a')], next: { label: 'Next', disabled } },
        {
          id: 's2',
          title: 'S2',
          fields: [field('b')],
          back: { label: 'Back', disabled },
          skip: { label: 'Skip', disabled },
        },
        { id: 's3', title: 'S3', fields: [field('c')] },
      ],
    });
    expect(codes(definition)).toEqual([
      'warning disabled-not-applicable /cancel/disabled',
      'warning disabled-not-applicable /steps/1/back/disabled',
      'warning disabled-not-applicable /steps/1/skip/disabled',
    ]);
  });

  it('accepts props on a field', () => {
    expect(codes(form([field('a', { type: 'x-rating', props: { stars: 5, palette: { on: 'gold' } } })]))).toEqual([]);
  });
});
