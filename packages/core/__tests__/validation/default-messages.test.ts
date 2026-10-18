import { describe, expect, it } from 'vitest';
import { getDefaultMessage } from '../../src/validation';

describe('getDefaultMessage', () => {
  it('returns default message for unknown rule', () => {
    expect(getDefaultMessage('unknown' as never)).toBe('Invalid value');
  });
});
