import { describe, expect, it } from 'vitest';
import { checkLimits, limitSpec, limitWrites, parseNumber, patternError } from './limits';

const number = limitSpec('number')!;
const text = limitSpec('text')!;

describe('parseNumber', () => {
  it.each([
    ['', {}],
    ['  ', {}],
    ['42', { value: 42 }],
    ['-3', { value: -3 }],
    ['−3', { value: -3 }],
    ['1.5', { value: 1.5 }],
    ['.5', { value: 0.5 }],
    ['0.125', { value: 0.125 }],
    ['abc', { error: 'Enter a number' }],
    ['1e3', { error: 'Enter a number' }],
    ['1-2', { error: 'Enter a number' }],
    ['1 000', { error: 'Type the number without separators' }],
    ['1,000,000', { error: 'Type the number without separators' }],
    ['1,234.5', { error: 'Type the number without separators' }],
    ['1.000', { error: 'Type 1000 or 1.0000' }],
    ['1,5', { error: 'Use . as the decimal mark' }],
  ])('reads %j in an English locale', (input, expected) => {
    expect(parseNumber(input, '.')).toEqual(expected);
  });

  it('accepts the locale decimal comma and the stored dot', () => {
    expect(parseNumber('1,5', ',')).toEqual({ value: 1.5 });
    expect(parseNumber('1.5', ',')).toEqual({ value: 1.5 });
    expect(parseNumber('1,500', ',')).toEqual({ error: 'Type 1500 or 1,5000' });
    expect(parseNumber('1.000.000', ',')).toEqual({ error: 'Type the number without separators' });
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
    expect(limitWrites(number, { min: '1.5' }, {})).toEqual([['min', 1.5]]);
    expect(limitWrites(number, { min: '' }, { min: 3, minMessage: 'Too small' })).toEqual([
      ['min', undefined],
      ['minMessage', undefined],
    ]);
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
