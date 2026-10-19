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
  const answers = { interests: ['design', 'other'] };

  it('matches contains when the list holds the operand', () => {
    expect(evaluateCondition({ field: 'interests', contains: 'other' }, answers)).toBe(true);
    expect(evaluateCondition({ field: 'interests', contains: 'music' }, answers)).toBe(false);
  });

  it('matches notContains when the list lacks the operand', () => {
    expect(evaluateCondition({ field: 'interests', notContains: 'music' }, answers)).toBe(true);
    expect(evaluateCondition({ field: 'interests', notContains: 'other' }, answers)).toBe(false);
  });

  it.each([undefined, null, 'other', 5, { other: true }])('treats %j as a list without the operand', (value) => {
    expect(evaluateCondition({ field: 'x', contains: 'other' }, { x: value })).toBe(false);
    expect(evaluateCondition({ field: 'x', notContains: 'other' }, { x: value })).toBe(true);
  });

  it('compares items strictly', () => {
    expect(evaluateCondition({ field: 'x', contains: 1 }, { x: ['1'] })).toBe(false);
    expect(evaluateCondition({ field: 'x', notContains: 'other' }, { x: [] })).toBe(true);
  });

  it('checks a list of more than 1000 items that no field limits', () => {
    const x = Array.from({ length: 1001 }, () => 'other');
    expect(evaluateCondition({ field: 'x', contains: 'other' }, { x })).toBe(true);
    expect(evaluateCondition({ field: 'x', notContains: 'other' }, { x })).toBe(false);
  });
});
