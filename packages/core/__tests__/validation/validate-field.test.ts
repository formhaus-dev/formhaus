import { describe, expect, it } from 'vitest';
import type { FormField } from '../../src/types';
import { validateFieldValue } from '../../src/validation';

const makeField = (overrides: Partial<FormField> = {}): FormField => ({
  key: 'test',
  type: 'text',
  label: 'Test',
  ...overrides,
});

describe('validateFieldValue', () => {
  it('handles invalid regex gracefully', () => {
    const field = makeField({ validation: { pattern: '[invalid(' } });
    expect(validateFieldValue(field, 'anything', {}, {})).toBeNull();
  });

  it('returns error when target field does not exist', () => {
    const field = makeField({ key: 'confirmEmail', validation: { matchField: 'email' } });
    expect(validateFieldValue(field, 'a@b.com', { confirmEmail: 'a@b.com' }, {})).toBe('Fields must match');
  });
});
