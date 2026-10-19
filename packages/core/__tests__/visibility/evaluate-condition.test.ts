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

describe('list operators', () => {
  const sources = { sourceOfWealth: ['SALARY', 'OTHER'] };

  it('matches contains when the list holds the operand', () => {
    expect(evaluateCondition({ field: 'sourceOfWealth', contains: 'OTHER' }, sources)).toBe(true);
    expect(evaluateCondition({ field: 'sourceOfWealth', contains: 'GIFT' }, sources)).toBe(false);
  });

  it('matches notContains when the list lacks the operand', () => {
    expect(evaluateCondition({ field: 'sourceOfWealth', notContains: 'GIFT' }, sources)).toBe(true);
    expect(evaluateCondition({ field: 'sourceOfWealth', notContains: 'OTHER' }, sources)).toBe(false);
  });

  it.each([undefined, null, 'OTHER', 5, { OTHER: true }])('treats %j as a list without the operand', (value) => {
    expect(evaluateCondition({ field: 'x', contains: 'OTHER' }, { x: value })).toBe(false);
    expect(evaluateCondition({ field: 'x', notContains: 'OTHER' }, { x: value })).toBe(true);
  });

  it('compares items strictly', () => {
    expect(evaluateCondition({ field: 'x', contains: 1 }, { x: ['1'] })).toBe(false);
    expect(evaluateCondition({ field: 'x', notContains: 'OTHER' }, { x: [] })).toBe(true);
  });
});
