import { describe, expect, it, vi } from 'vitest';
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

  it('increments the form snapshot on mutation', () => {
    const engine = new FormEngine(basicDefinition);
    const snapshot = engine.getSnapshot();
    engine.setValue('name', 'test');
    expect(engine.getSnapshot()).toBe(snapshot + 1);
  });

  it('stops notifying an unsubscribed listener', () => {
    const engine = new FormEngine(basicDefinition);
    const listener = vi.fn();
    const unsubscribe = engine.subscribe(listener);
    engine.setValue('name', 'test');
    unsubscribe();
    engine.setValue('name', 'test2');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('notifies multiple subscribers independently', () => {
    const engine = new FormEngine(basicDefinition);
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = engine.subscribe(first);
    engine.subscribe(second);
    engine.setValue('name', 'test');
    unsubscribeFirst();
    engine.setValue('name', 'test2');
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledTimes(2);
  });

  it('resets values and errors to field defaults', () => {
    const definition: FormDefinition = {
      id: 'reset',
      title: 'Reset',
      submit: { label: 'Submit' },
      fields: [{ key: 'name', type: 'text', label: 'Name', defaultValue: 'default' }],
    };
    const engine = new FormEngine(definition, { name: 'modified' });
    engine.errors = { name: 'error' };
    engine.reset();
    expect(engine.values.name).toBe('default');
    expect(engine.errors).toEqual({});
  });

  it('resets to provided values', () => {
    const engine = new FormEngine(basicDefinition, { name: 'modified' });
    engine.reset({ name: 'new' });
    expect(engine.values.name).toBe('new');
  });

  it('clears values for fields hidden by the reset values', () => {
    const engine = new FormEngine(conditionalDefinition);
    engine.reset({ country: 'MX', routing: 'STALE' });
    expect(engine.values.routing).toBeUndefined();

    engine.setValue('country', 'US');
    expect(engine.values.routing).toBeUndefined();
  });

  it('clears values for fields hidden by the initial values', () => {
    const engine = new FormEngine(conditionalDefinition, { country: 'MX', routing: 'STALE' });
    expect(engine.values.routing).toBeUndefined();

    engine.setValue('country', 'US');
    expect(engine.values.routing).toBeUndefined();
  });

  it('clears values in steps hidden by the reset values', () => {
    const definition: FormDefinition = {
      id: 'hidden-step-reset',
      title: 'Hidden step reset',
      submit: { label: 'Submit' },
      steps: [
        { id: 'main', title: 'Main', fields: [{ key: 'accountType', type: 'text', label: 'Type' }] },
        {
          id: 'business',
          title: 'Business',
          fields: [
            { key: 'taxId', type: 'text', label: 'Tax ID' },
            { key: 'vat', type: 'text', label: 'VAT' },
          ],
          show: [{ field: 'accountType', eq: 'business' }],
        },
      ],
    };
    const engine = new FormEngine(definition);
    engine.reset({ accountType: 'personal', taxId: 'STALE', vat: 'STALE' });
    expect(engine.values.taxId).toBeUndefined();
    expect(engine.values.vat).toBeUndefined();
  });

  it('sets and clears field loading state', () => {
    const engine = new FormEngine(basicDefinition);
    engine.setFieldLoading('name', true);
    expect(engine.fieldLoading.name).toBe(true);
    engine.setFieldLoading('name', false);
    expect(engine.fieldLoading.name).toBeUndefined();
  });

  it('clears field loading state on reset', () => {
    const engine = new FormEngine(basicDefinition);
    engine.setFieldLoading('name', true);
    engine.reset();
    expect(engine.fieldLoading).toEqual({});
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
