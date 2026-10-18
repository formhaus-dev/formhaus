import { describe, expect, it, vi } from 'vitest';
import { FormDefinitionError, FormEngine, type FormDefinition } from '../../src';
import { validateSubmission } from '../../src/server';

const withWarning: FormDefinition = {
  id: 'check',
  title: 'Check',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation: { validator: 'known' } }],
};

const invalid = {
  id: 'check',
  title: 'Check',
  submit: { label: 'Send' },
  fields: [{ key: 'name', type: 'text', label: 'Name', validation: { pattern: '(' } }],
} as FormDefinition;

describe('definition check on the server path', () => {
  it('still checks a definition passed to validateSubmission', () => {
    expect(() => validateSubmission(invalid, { name: 'x' })).toThrow(FormDefinitionError);
  });

  it('keeps the FormEngine check for a definition already passed to validateSubmission', () => {
    expect(validateSubmission(withWarning, { name: 'Ada' }, { validators: { known: () => null } }).errors).toEqual({});
    const onWarning = vi.fn();
    new FormEngine(withWarning, {}, { validators: {}, onWarning });
    expect(onWarning).toHaveBeenCalledWith(expect.objectContaining({ code: 'unknown-validator' }));
  });

  it('keeps the FormEngine error check after validateSubmission throws', () => {
    expect(() => validateSubmission(invalid, {})).toThrow(FormDefinitionError);
    expect(() => new FormEngine(invalid)).toThrow(FormDefinitionError);
  });
});
