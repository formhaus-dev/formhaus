import { describe, expect, it, vi } from 'vitest';
import { validateSubmission } from '../../src/server';
import type { FormDefinition } from '../../src';

describe('validateSubmission with a skipped controlling step', () => {
  const definition: FormDefinition = {
    id: 'skip-rules',
    title: 'Skip rules',
    submit: { label: 'Send' },
    steps: [
      { id: 's1', title: 'One', skip: { label: 'Skip' }, fields: [{ key: 'a', type: 'text', label: 'A', defaultValue: 'show' }] },
      {
        id: 's2',
        title: 'Two',
        fields: [
          { key: 'n', type: 'number', label: 'N', show: [{ field: 'a', eq: 'show' }], validation: { min: 10 } },
          { key: 'code', type: 'text', label: 'Code', show: [{ field: 'a', eq: 'show' }], validation: { pattern: '^[A-Z]+$' } },
          {
            key: 'g',
            type: 'group',
            label: 'G',
            fields: [{ key: 'm', type: 'number', label: 'M', show: [{ field: 'a', eq: 'show' }], validation: { max: 5 } }],
          },
        ],
      },
    ],
  };

  it('runs the rules of fields that the skipped step defaults show', () => {
    const result = validateSubmission(definition, { a: 'show', n: 1, code: 'abc', g: [{ m: 9 }] }, { skippedSteps: ['s1'] });
    expect(result.values).toEqual({ n: 1, code: 'abc', g: [{ m: 9 }] });
    expect(Object.keys(result.errors).sort()).toEqual(['code', 'g.0.m', 'n']);
  });

  it('calls a custom validator once per field', () => {
    const custom: FormDefinition = {
      ...definition,
      steps: [
        definition.steps![0],
        { id: 's2', title: 'Two', fields: [{ key: 'b', type: 'text', label: 'B', validation: { validator: 'check' } }] },
      ],
    };
    const check = vi.fn(() => null);
    const result = validateSubmission(custom, { b: 'x' }, { skippedSteps: ['s1'], validators: { check } });
    expect(result).toEqual({ values: { b: 'x' }, errors: {} });
    expect(check).toHaveBeenCalledTimes(1);
  });
});

describe('validateSubmission with missing keys', () => {
  it('does not fill a default for a key the payload leaves out', () => {
    const definition: FormDefinition = {
      id: 'consent',
      title: 'Consent',
      submit: { label: 'Send' },
      fields: [
        { key: 'ask', type: 'checkbox', label: 'Ask' },
        { key: 'consent', type: 'checkbox', label: 'Consent', defaultValue: true, show: [{ field: 'ask', eq: true }] },
        { key: 'note', type: 'text', label: 'Note', defaultValue: 'n', show: [{ field: 'consent', eq: true }] },
        {
          key: 'g',
          type: 'group',
          label: 'G',
          defaultItems: 1,
          fields: [{ key: 'k', type: 'text', label: 'K', defaultValue: 'd' }],
        },
      ],
    };
    expect(validateSubmission(definition, { ask: true })).toEqual({ values: { ask: true }, errors: {} });
    expect(validateSubmission(definition, { ask: true, g: [{}] })).toEqual({ values: { ask: true, g: [{}] }, errors: {} });
    expect(validateSubmission(definition, { ask: true, consent: true, note: 'x' })).toEqual({
      values: { ask: true, consent: true, note: 'x' },
      errors: {},
    });
  });
});

describe('validateSubmission with a group missing from the payload', () => {
  const definition: FormDefinition = {
    id: 'missing-group',
    title: 'Missing group',
    submit: { label: 'Send' },
    fields: [
      { key: 'on', type: 'checkbox', label: 'On' },
      {
        key: 'g',
        type: 'group',
        label: 'G',
        defaultItems: 1,
        show: [{ field: 'on', eq: true }],
        validation: { required: true },
        fields: [{ key: 'name', type: 'text', label: 'Name', defaultValue: 'Ada', validation: { required: true } }],
      },
    ],
  };

  it('does not create the default items of a conditional group', () => {
    const result = validateSubmission(definition, { on: true });
    expect(result.values).toEqual({ on: true });
    expect(Object.keys(result.errors)).toEqual(['g']);
  });

  it('does not create the default items of a group on a step shown by a skipped step', () => {
    const steps: FormDefinition = {
      id: 'skip-shown',
      title: 'Skip shown',
      submit: { label: 'Send' },
      steps: [
        { id: 's1', title: 'One', skip: { label: 'Skip' }, fields: [{ key: 'a', type: 'text', label: 'A', defaultValue: 'show' }] },
        {
          id: 's2',
          title: 'Two',
          show: [{ field: 'a', eq: 'show' }],
          fields: [
            { key: 'b', type: 'text', label: 'B', defaultValue: 'B' },
            { key: 'g', type: 'group', label: 'G', defaultItems: 1, fields: [{ key: 'k', type: 'text', label: 'K', defaultValue: 'd' }] },
          ],
        },
      ],
    };
    expect(validateSubmission(steps, {}, { skippedSteps: ['s1'] })).toEqual({ values: {}, errors: {} });
    expect(validateSubmission(steps, { a: 'show' })).toEqual({ values: { a: 'show' }, errors: {} });
  });
});

describe('validateSubmission with a field shown by the defaults of a skipped step', () => {
  const definition: FormDefinition = {
    id: 'skip-default',
    title: 'Skip default',
    submit: { label: 'Send' },
    steps: [
      { id: 's1', title: 'One', skip: { label: 'Skip' }, fields: [{ key: 'a', type: 'text', label: 'A', defaultValue: 'show' }] },
      {
        id: 's2',
        title: 'Two',
        fields: [
          { key: 'n', type: 'number', label: 'N', show: [{ field: 'a', eq: 'show' }], validation: { required: true, min: 10 } },
          { key: 'm', type: 'number', label: 'M', show: [{ field: 'a', eq: 'show' }] },
        ],
      },
    ],
  };
  const skip = { skippedSteps: ['s1'] };

  it('keeps an answer the browser sent without the skipped field', () => {
    expect(validateSubmission(definition, { n: 12, m: 3 }, skip)).toEqual({ values: { n: 12, m: 3 }, errors: {} });
  });

  it('runs the rules of that answer', () => {
    expect(validateSubmission(definition, { n: 2 }, skip).errors).toEqual({ n: 'Must be at least 10' });
    expect(Object.keys(validateSubmission(definition, {}, skip).errors)).toEqual(['n']);
  });
});
