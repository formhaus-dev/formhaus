import { describe, expect, it } from 'vitest';
import type { FormStep } from '../../src/types';
import { validateStep } from '../../src/validation';

describe('validateStep', () => {
  it('validates only visible fields', () => {
    const step: FormStep = {
      id: 'step-1',
      title: 'Step 1',
      fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
        {
          key: 'clabe',
          type: 'text',
          label: 'CLABE',
          validation: { required: true },
          show: [{ field: 'country', eq: 'MX' }],
        },
      ],
    };

    const errors = validateStep(step, { country: 'US' });
    expect(errors).toEqual({ name: 'This field is required' });
    expect(errors.clabe).toBeUndefined();
  });

  it('validates hidden field when it becomes visible', () => {
    const step: FormStep = {
      id: 'step-1',
      title: 'Step 1',
      fields: [
        {
          key: 'clabe',
          type: 'text',
          label: 'CLABE',
          validation: { required: true },
          show: [{ field: 'country', eq: 'MX' }],
        },
      ],
    };

    const errors = validateStep(step, { country: 'MX' });
    expect(errors).toEqual({ clabe: 'This field is required' });
  });

  it('returns empty object when all fields pass', () => {
    const step: FormStep = {
      id: 'step-1',
      title: 'Step 1',
      fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
    };

    const errors = validateStep(step, { name: 'John' });
    expect(errors).toEqual({});
  });

  it('returns empty object when step has no fields', () => {
    const step: FormStep = {
      id: 'step-1',
      title: 'Empty Step',
      fields: [],
    };

    const errors = validateStep(step, {});
    expect(errors).toEqual({});
  });

  it('returns empty when all fields are hidden', () => {
    const step: FormStep = {
      id: 'step-1',
      title: 'Step 1',
      fields: [
        {
          key: 'hidden',
          type: 'text',
          label: 'Hidden',
          validation: { required: true },
          show: [{ field: 'never', eq: 'match' }],
        },
      ],
    };

    const errors = validateStep(step, {});
    expect(errors).toEqual({});
  });
});
