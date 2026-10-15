import { describe, expect, it } from 'vitest';
import { draftValues } from '../../src/cloud/draft';
import type { FormDefinition } from '../../src';

const branches = {
  id: 'branches',
  title: 'Branches',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'start',
      title: 'Start',
      fields: [
        {
          key: 'kind',
          type: 'radio',
          label: 'Kind',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
      ],
    },
    { id: 'a', title: 'A', show: [{ field: 'kind', eq: 'a' }], fields: [{ key: 'secret', type: 'password', label: 'Password' }] },
    { id: 'b', title: 'B', show: [{ field: 'kind', eq: 'b' }], fields: [{ key: 'secret', type: 'text', label: 'Code' }] },
  ],
} as FormDefinition;

describe('draftValues', () => {
  it('never keeps a key that any password, file or hidden field uses', () => {
    expect(draftValues(branches, { kind: 'a', secret: 'hunter2' })).toEqual({ kind: 'a' });
    expect(draftValues(branches, { kind: 'b', secret: 'hunter2' })).toEqual({ kind: 'b' });
  });

  it('drops hidden values', () => {
    const definition = {
      id: 'h',
      title: 'H',
      submit: { label: 'Send' },
      fields: [
        { key: 'name', type: 'text', label: 'Name' },
        { key: 'token', type: 'hidden' },
      ],
    } as FormDefinition;
    expect(draftValues(definition, { name: 'Ada', token: 'abc' })).toEqual({ name: 'Ada' });
  });
});
