import { describe, expect, it } from 'vitest';
import { validateSubmission } from '../../src/server';
import type { FormDefinition } from '../../src/types';

const crew: FormDefinition = {
  id: 'crew',
  title: 'Crew',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'crew',
      type: 'group',
      label: 'Crew',
      fields: [
        {
          key: 'kind',
          type: 'select',
          label: 'Kind',
          options: [
            { value: 'x', label: 'X' },
            { value: 'y', label: 'Y' },
          ],
        },
        { key: 'count', type: 'number', label: 'Count', defaultValue: 1, show: [{ field: 'kind', eq: 'x' }] },
      ],
    },
  ],
};

describe('defaults of fields that start hidden or are shown again', () => {
  it('does not restore an item value the server rejected', () => {
    const result = validateSubmission(crew, { crew: [{ kind: 'x', count: 'many' }] });
    expect(result.values).toEqual({ crew: [{ kind: 'x' }] });
    expect(result.errors).toHaveProperty(['crew.0.count']);
  });
});
