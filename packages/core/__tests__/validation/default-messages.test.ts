import { describe, expect, it } from 'vitest';
import { getDefaultMessage } from '../../src/validation';

describe('getDefaultMessage', () => {
  it('returns required message', () => {
    expect(getDefaultMessage('required')).toBe('This field is required');
  });

  it('returns minLength message with interpolation', () => {
    expect(getDefaultMessage('minLength', { min: 3 })).toBe('Must be at least 3 characters');
  });

  it('returns maxLength message with interpolation', () => {
    expect(getDefaultMessage('maxLength', { max: 10 })).toBe('Must be at most 10 characters');
  });

  it('returns min message with interpolation', () => {
    expect(getDefaultMessage('min', { min: 5 })).toBe('Must be at least 5');
  });

  it('returns max message with interpolation', () => {
    expect(getDefaultMessage('max', { max: 100 })).toBe('Must be at most 100');
  });

  it('returns default message for unknown rule', () => {
    expect(getDefaultMessage('unknown' as never)).toBe('Invalid value');
  });
});
