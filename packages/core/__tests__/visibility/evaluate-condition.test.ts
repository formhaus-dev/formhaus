import { describe, expect, it } from 'vitest';
import { evaluateCondition } from '../../src/visibility';

describe('evaluateCondition', () => {
  it('eq: returns true when value matches', () => {
    expect(evaluateCondition({ field: 'country', eq: 'MX' }, { country: 'MX' })).toBe(true);
  });

  it('eq: returns false when value differs', () => {
    expect(evaluateCondition({ field: 'country', eq: 'MX' }, { country: 'US' })).toBe(false);
  });

  it('eq: handles boolean values', () => {
    expect(evaluateCondition({ field: 'agree', eq: true }, { agree: true })).toBe(true);
    expect(evaluateCondition({ field: 'agree', eq: true }, { agree: false })).toBe(false);
  });

  it('neq: returns true when value differs', () => {
    expect(evaluateCondition({ field: 'country', neq: 'MX' }, { country: 'US' })).toBe(true);
  });

  it('neq: returns false when value matches', () => {
    expect(evaluateCondition({ field: 'country', neq: 'MX' }, { country: 'MX' })).toBe(false);
  });

  it('in: returns true when value is in list', () => {
    expect(evaluateCondition({ field: 'country', in: ['MX', 'US', 'CA'] }, { country: 'US' })).toBe(true);
  });

  it('in: returns false when value is not in list', () => {
    expect(evaluateCondition({ field: 'country', in: ['MX', 'US'] }, { country: 'BR' })).toBe(false);
  });

  it('notIn: returns true when value is not in list', () => {
    expect(evaluateCondition({ field: 'country', notIn: ['MX', 'US'] }, { country: 'BR' })).toBe(true);
  });

  it('notIn: returns false when value is in list', () => {
    expect(evaluateCondition({ field: 'country', notIn: ['MX', 'US'] }, { country: 'MX' })).toBe(false);
  });

  it('notEmpty: returns true for non-empty string', () => {
    expect(evaluateCondition({ field: 'name', notEmpty: true }, { name: 'John' })).toBe(true);
  });

  it('notEmpty: returns false for empty string', () => {
    expect(evaluateCondition({ field: 'name', notEmpty: true }, { name: '' })).toBe(false);
  });

  it('notEmpty: returns false for null', () => {
    expect(evaluateCondition({ field: 'name', notEmpty: true }, { name: null })).toBe(false);
  });

  it('notEmpty: returns false for undefined (missing key)', () => {
    expect(evaluateCondition({ field: 'name', notEmpty: true }, {})).toBe(false);
  });

  it('notEmpty: returns true for 0 (number zero is non-empty)', () => {
    expect(evaluateCondition({ field: 'amount', notEmpty: true }, { amount: 0 })).toBe(true);
  });

  it('never matches a condition without a known operator', () => {
    expect(evaluateCondition({ field: 'missing' }, {})).toBe(false);
    expect(evaluateCondition({ field: 'a', equals: 'x' } as never, { a: 'x' })).toBe(false);
  });

  it('eq: returns false for non-existent field (undefined !== value)', () => {
    expect(evaluateCondition({ field: 'missing', eq: 'MX' }, {})).toBe(false);
  });
});

describe('comparison operators', () => {
  it.each([
    [{ gt: 5 }, [6, '6', '5.5'], [5, '5', 4]],
    [{ gte: 9 }, [9, '9', 10], [8, '8.99']],
    [{ lt: 7 }, [6, '0', -1], [7, '7']],
    [{ lte: 6 }, [6, '-0.5'], [6.01, '7']],
  ])('%j compares numbers and numeric strings', (operator, matching, failing) => {
    for (const value of matching) expect(evaluateCondition({ field: 'x', ...operator }, { x: value })).toBe(true);
    for (const value of failing) expect(evaluateCondition({ field: 'x', ...operator }, { x: value })).toBe(false);
  });

  it.each([undefined, null, '', ' ', 'abc', true, [], [9], NaN, Infinity])('never matches %j', (value) => {
    expect(evaluateCondition({ field: 'x', gte: 0 }, { x: value })).toBe(false);
    expect(evaluateCondition({ field: 'x', lt: 1e9 }, { x: value })).toBe(false);
  });
});
