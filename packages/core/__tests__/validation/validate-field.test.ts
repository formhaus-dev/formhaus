import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FormField } from '../../src/types';
import { validateFieldValue } from '../../src/validation';

const makeField = (overrides: Partial<FormField> = {}): FormField => ({
  key: 'test',
  type: 'text',
  label: 'Test',
  ...overrides,
});

describe('validateFieldValue', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fails a pattern whose test throws', () => {
    vi.spyOn(RegExp.prototype, 'test').mockImplementation(() => {
      throw new RangeError('Maximum call stack size exceeded');
    });
    expect(validateFieldValue(makeField({ validation: { pattern: '^throws$' } }), 'value', {})).toBe('Invalid format');
    expect(validateFieldValue(makeField({ validation: { pattern: '^throws$', patternMessage: 'Bad' } }), 'value', {})).toBe('Bad');
  });

  it('handles invalid regex gracefully', () => {
    const field = makeField({ validation: { pattern: '[invalid(' } });
    expect(validateFieldValue(field, 'anything', {})).toBeNull();
  });

  it('returns error when target field does not exist', () => {
    const field = makeField({ key: 'confirmEmail', validation: { matchField: 'email' } });
    expect(validateFieldValue(field, 'a@b.com', { confirmEmail: 'a@b.com' })).toBe('Fields must match');
  });
});
