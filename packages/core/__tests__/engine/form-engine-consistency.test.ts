import { describe, expect, it } from 'vitest';
import { validateFieldValue } from '../../src/validation';

describe('engine consistency', () => {
  it('treats an unchecked consent checkbox or switch as missing for required', () => {
    for (const type of ['checkbox', 'switch']) {
      const field = { key: 'terms', type, label: 'Terms', validation: { required: 'Accept the terms' } };
      expect(validateFieldValue(field, false, {})).toBe('Accept the terms');
      expect(validateFieldValue(field, true, {})).toBeNull();
    }
    const number = { key: 'n', type: 'number', label: 'N', validation: { required: true } };
    expect(validateFieldValue(number, 0, {})).toBeNull();
  });
});
