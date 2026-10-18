import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import { validateSubmission } from '../../src/server';
import type { FormDefinition, FormField } from '../../src/types';

describe('defaults of a key declared on two routes', () => {
  const branches = (field: (branch: 'a' | 'b') => FormField): FormDefinition => ({
    id: 'branches',
    title: 'Branches',
    submit: { label: 'Send' },
    steps: [
      {
        id: 'pick',
        title: 'Pick',
        fields: [
          {
            key: 'route',
            type: 'radio',
            label: 'Route',
            options: [
              { value: 'a', label: 'A' },
              { value: 'b', label: 'B' },
            ],
          },
        ],
        routes: [{ to: 'b', show: [{ field: 'route', eq: 'b' }] }],
      },
      { id: 'a', title: 'A', fields: [field('a')], routes: [{ to: null }] },
      { id: 'b', title: 'B', fields: [field('b')] },
    ],
  });
  const n = (branch: 'a' | 'b'): FormField => ({ key: 'n', type: 'number', label: 'N', defaultValue: branch === 'a' ? 1 : 2 });

  it('takes the default of the active route when another route reuses a field object', () => {
    const shared = n('a');
    const [pick] = branches(n).steps!;
    const definition: FormDefinition = {
      ...branches(n),
      steps: [
        {
          ...pick,
          routes: [
            { to: 'b', show: [{ field: 'route', eq: 'b' }] },
            { to: 'c', show: [{ field: 'route', eq: 'c' }] },
          ],
        },
        { id: 'a', title: 'A', fields: [shared], routes: [{ to: null }] },
        { id: 'b', title: 'B', fields: [n('b')], routes: [{ to: null }] },
        { id: 'c', title: 'C', fields: [shared] },
      ],
    };
    expect(new FormEngine(definition, { route: 'b' }).getSubmitValues()).toEqual({ route: 'b', n: 2 });
  });
});

describe('a key on two exclusive steps that controls a route', () => {
  const exclusive: FormDefinition = {
    id: 'exclusive',
    title: 'Exclusive',
    submit: { label: 'Send' },
    steps: [
      {
        id: 'start',
        title: 'Start',
        fields: [{ key: 'flag', type: 'checkbox', label: 'Flag', defaultValue: true }],
        routes: [{ to: 'b', show: [{ field: 'flag', eq: false }] }],
      },
      {
        id: 'a',
        title: 'A',
        show: [{ field: 'flag', eq: true }],
        fields: [{ key: 'x', type: 'text', label: 'X', defaultValue: 'saved' }],
        routes: [{ to: null, show: [{ field: 'x', eq: 'saved' }] }, { to: null }],
      },
      { id: 'b', title: 'B', show: [{ field: 'flag', eq: false }], fields: [{ key: 'x', type: 'text', label: 'X' }] },
    ],
  };

  it('validates a submission without looping', () => {
    expect(validateSubmission(exclusive, { flag: true, x: 'saved' })).toEqual({ values: { flag: true, x: 'saved' }, errors: {} });
    expect(validateSubmission(exclusive, { flag: false })).toEqual({ values: { flag: false }, errors: {} });
  });
});
