import { describe, expect, it } from 'vitest';
import { evaluateCondition } from '../../src/visibility';

describe('evaluateCondition', () => {
  it('never matches a condition without a known operator', () => {
    expect(evaluateCondition({ field: 'missing' }, {})).toBe(false);
    expect(evaluateCondition({ field: 'a', equals: 'x' } as never, { a: 'x' })).toBe(false);
  });
});

describe('comparison operators', () => {
  it.each([Number.NaN, Infinity])('never matches %j', (value) => {
    expect(evaluateCondition({ field: 'x', gte: 0 }, { x: value })).toBe(false);
    expect(evaluateCondition({ field: 'x', lt: 1e9 }, { x: value })).toBe(false);
  });
});
