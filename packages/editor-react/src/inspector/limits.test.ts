import { describe, expect, it } from 'vitest';
import { checkLimits, limitSpec, limitWrites, parseNumber, patternError } from './limits';

const number = limitSpec('number')!;
const text = limitSpec('text')!;

describe('parseNumber', () => {
  it.each([
    ['', undefined],
    ['  ', undefined],
    ['42', 42],
    ['-3', -3],
    ['−3', -3],
    ['1.5', 1.5],
    ['1,5', 1.5],
    ['.5', 0.5],
    ['1 000', 1000],
    ['1 000', 1000],
    ['1,000,000', 1000000],
    ['1.000.000', 1000000],
    ['1,234.5', 1234.5],
    ['1.234,5', 1234.5],
    ["1'000", 1000],
    ['abc', null],
    ['1e3', null],
    ['1-2', null],
  ])('reads %j as %j', (input, expected) => {
    expect(parseNumber(input, '.')).toBe(expected);
  });

  it('follows the decimal mark of the locale for a lone separator before three digits', () => {
    expect(parseNumber('1,500', '.')).toBe(1500);
    expect(parseNumber('1,500', ',')).toBe(1.5);
    expect(parseNumber('1.500', ',')).toBe(1500);
    expect(parseNumber('1.500', '.')).toBe(1.5);
  });
});

describe('limits per type', () => {
  it('maps number, text, textarea and multiselect to their rules', () => {
    expect([number.low.rule, number.high.rule, number.pattern]).toEqual(['min', 'max', false]);
    expect([text.low.rule, text.high.rule, text.pattern]).toEqual(['minLength', 'maxLength', true]);
    expect(limitSpec('textarea')).toBe(text);
    expect(limitSpec('multiselect')?.low.label).toBe('Min selections');
    expect(limitSpec('date')).toBeUndefined();
    expect(limitSpec('scale')).toBeUndefined();
  });

  it('writes a valid bound and clears an empty one', () => {
    expect(limitWrites(number, { min: '1,5' }, {})).toEqual([['min', 1.5]]);
    expect(limitWrites(number, { min: '' }, { min: 3 })).toEqual([['min', undefined]]);
    expect(limitWrites(number, { min: '3' }, { min: 3 })).toEqual([]);
  });

  it('refuses a minimum above the maximum', () => {
    expect(checkLimits(number, { min: '20' }, { max: 10 }).min?.error).toBe("Can't be more than 10");
    expect(checkLimits(number, { max: '5' }, { min: 10 }).max?.error).toBe("Can't be less than 10");
    expect(limitWrites(number, { min: '20' }, { max: 10 })).toEqual([]);
    expect(checkLimits(number, {}, { min: 20, max: 10 }).min?.error).toBe("Can't be more than 10");
  });

  it('writes a held bound once the other side makes room', () => {
    expect(limitWrites(number, { min: '20', max: '30' }, { max: 10 })).toEqual([
      ['min', 20],
      ['max', 30],
    ]);
  });

  it('asks for whole numbers for counts', () => {
    expect(checkLimits(text, { minLength: '2.5' }, {}).minLength?.error).toBe('Enter a whole number');
    expect(checkLimits(text, { minLength: '-1' }, {}).minLength?.error).toBe('Enter a whole number');
    expect(checkLimits(number, { min: 'x' }, {}).min?.error).toBe('Enter a number');
    expect(checkLimits(number, { min: '-1' }, {}).min?.error).toBeUndefined();
  });

  it('describes the default message for a bound', () => {
    expect(text.low.fallback(3)).toBe('Minimum length is 3');
    expect(number.high.fallback(9)).toBe('Must be at most 9');
  });

  it('flags a pattern that is not a regular expression', () => {
    expect(patternError('^[a-z]+$')).toBeUndefined();
    expect(patternError('([a-z]')).toBe('Not a valid pattern');
  });
});
