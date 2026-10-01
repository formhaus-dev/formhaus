import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';
import { basicDefinition, conditionalDefinition } from './form-engine.fixtures';

describe('FormEngine validation and errors', () => {
  it('returns errors for invalid visible fields', () => {
    const engine = new FormEngine(basicDefinition);
    expect(engine.validate().name).toBe('This field is required');
  });

  it('does not validate hidden fields', () => {
    const definition: FormDefinition = {
      id: 'hidden-validation',
      title: 'Hidden',
      submit: { label: 'Submit' },
      fields: [{
        key: 'hidden',
        type: 'text',
        label: 'Hidden',
        validation: { required: true },
        show: [{ field: 'x', eq: 'y' }],
      }],
    };
    expect(new FormEngine(definition).validate().hidden).toBeUndefined();
  });

  it('validates a single field and updates errors', () => {
    const engine = new FormEngine(basicDefinition);
    expect(engine.validateField('name')).toBe('This field is required');
    expect(engine.errors.name).toBe('This field is required');
  });

  it('clears a field error when the field is valid', () => {
    const engine = new FormEngine(basicDefinition, { name: 'John' });
    engine.errors = { name: 'old error' };
    expect(engine.validateField('name')).toBeNull();
    expect(engine.errors.name).toBeUndefined();
  });

  it('does not validate a field whose containing step is hidden', () => {
    const definition: FormDefinition = {
      id: 'hidden-step',
      title: 'Hidden step',
      submit: { label: 'Submit' },
      steps: [
        { id: 'main', title: 'Main', fields: [{ key: 'accountType', type: 'text', label: 'Account type' }] },
        {
          id: 'business',
          title: 'Business',
          fields: [{ key: 'taxId', type: 'text', label: 'Tax ID', validation: { required: true } }],
          show: [{ field: 'accountType', eq: 'business' }],
        },
      ],
    };
    const engine = new FormEngine(definition);
    expect(engine.validateField('taxId')).toBeNull();
    expect(engine.errors.taxId).toBeUndefined();
  });

  it('returns only visible field values for submission', () => {
    const engine = new FormEngine(conditionalDefinition, {
      country: 'MX',
      clabe: '123',
      routing: '456',
    });
    expect(engine.getSubmitValues()).toEqual({ country: 'MX', clabe: '123' });
  });

  it('sets errors on visible fields', () => {
    const engine = new FormEngine(basicDefinition);
    engine.setErrors({ name: 'Server says no' });
    expect(engine.errors.name).toBe('Server says no');
  });

  it('surfaces errors on hidden fields as top-level errors', () => {
    const engine = new FormEngine(conditionalDefinition, { country: 'US' });
    engine.setErrors({ clabe: 'Invalid CLABE' });
    expect(engine.errors.clabe).toBeUndefined();
    expect(engine.topLevelErrors).toContain('Invalid CLABE');
  });

  it('surfaces errors from hidden steps as top-level errors', () => {
    const definition: FormDefinition = {
      id: 'hidden-step-errors',
      title: 'Hidden step errors',
      submit: { label: 'Submit' },
      steps: [
        { id: 'main', title: 'Main', fields: [{ key: 'kind', type: 'text', label: 'Kind' }] },
        {
          id: 'business',
          title: 'Business',
          show: [{ field: 'kind', eq: 'business' }],
          fields: [{ key: 'company', type: 'text', label: 'Company' }],
        },
      ],
    };
    const engine = new FormEngine(definition, { kind: 'personal' });

    engine.setErrors({ company: 'Invalid company' });

    expect(engine.errors.company).toBeUndefined();
    expect(engine.topLevelErrors).toEqual(['Invalid company']);
    expect(engine.currentStep?.id).toBe('main');
  });

  it('replaces previous errors instead of merging', () => {
    const engine = new FormEngine(basicDefinition);
    engine.setErrors({ name: 'First error' });
    engine.setErrors({ email: 'Second error' });
    expect(engine.errors).toEqual({ email: 'Second error' });
  });

  it('uses validators passed to the constructor', () => {
    const definition: FormDefinition = {
      id: 'custom',
      title: 'Custom',
      submit: { label: 'Submit' },
      fields: [{ key: 'code', type: 'text', label: 'Code', validation: { validator: 'checkCode' } }],
    };
    const engine = new FormEngine(definition, { code: 'bad' }, {
      validators: { checkCode: (value) => (value === 'good' ? null : 'Invalid code') },
    });
    expect(engine.validate().code).toBe('Invalid code');
  });
});
