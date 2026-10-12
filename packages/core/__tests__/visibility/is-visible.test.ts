import { describe, expect, it } from 'vitest';
import { isVisible } from '../../src/visibility';

describe('isVisible', () => {
  it('returns true when no conditions', () => {
    expect(isVisible({}, {})).toBe(true);
  });

  it('show: AND logic - all conditions must pass', () => {
    const field = {
      show: [
        { field: 'country', eq: 'MX' as const },
        { field: 'method', eq: 'bank' as const },
      ],
    };
    expect(isVisible(field, { country: 'MX', method: 'bank' })).toBe(true);
    expect(isVisible(field, { country: 'MX', method: 'cash' })).toBe(false);
    expect(isVisible(field, { country: 'US', method: 'bank' })).toBe(false);
  });

  it('showAny: OR logic - any condition passes', () => {
    const field = {
      showAny: [
        { field: 'method', eq: 'bank' as const },
        { field: 'method', eq: 'clabe' as const },
      ],
    };
    expect(isVisible(field, { method: 'bank' })).toBe(true);
    expect(isVisible(field, { method: 'clabe' })).toBe(true);
    expect(isVisible(field, { method: 'cash' })).toBe(false);
  });

  it('show + showAny combined: both groups must pass', () => {
    const field = {
      show: [{ field: 'country', eq: 'MX' as const }],
      showAny: [
        { field: 'method', eq: 'bank' as const },
        { field: 'method', eq: 'clabe' as const },
      ],
    };
    expect(isVisible(field, { country: 'MX', method: 'bank' })).toBe(true);
    expect(isVisible(field, { country: 'MX', method: 'clabe' })).toBe(true);
    expect(isVisible(field, { country: 'MX', method: 'cash' })).toBe(false);
    expect(isVisible(field, { country: 'US', method: 'bank' })).toBe(false);
  });

  it('empty show array means always visible (AND of nothing = true)', () => {
    expect(isVisible({ show: [] }, {})).toBe(true);
  });

  it('empty showAny array means always visible (OR of nothing = true)', () => {
    expect(isVisible({ showAny: [] }, {})).toBe(true);
  });
});
