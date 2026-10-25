import { describe, expect, it } from 'vitest';
import { slowPattern } from '../../src/definition-validation/slow-pattern';

const letters = Array.from({ length: 150 }, (_, index) => {
  const start = 0x100 + index * 5;
  return `${String.fromCharCode(start)}-${String.fromCharCode(start + 2)}`;
}).join('');

describe('slowPattern', () => {
  it('reads the text after \\k as pattern unless it is a group name', () => {
    expect(
      ['(?<s>a)\\k<(a+)+>', '(?<s>a)\\k<(a|a)+>', '(?<s>a)a*\\k<s>*$', '(?<s>a)a*\\k<\\u{73}>*$', '(?<s>a)a*\\k<\\u0073>*$'].map(
        (pattern) => slowPattern(pattern),
      ),
    ).toEqual(['nested', 'nested', 'adjacent', 'adjacent', 'adjacent']);
  });

  it('does not report a repeated group with a separator class that nothing else in it matches', () => {
    const patterns = [
      "^[A-Za-z]+([ '-][A-Za-z]+)*$",
      '^[A-Za-z]+(\\s[A-Za-z]+)*$',
      '^\\w+(?:\\s+\\w+)*$',
      "^[\\p{L}]+(?:[ '-][\\p{L}]+)*$",
      "^[\\p{L}0-9]+(?:[ &.,'()-]+[\\p{L}0-9]+)*$",
      '^[a-z0-9]+(?:[._-][a-z0-9]+)*@[a-z0-9]+(?:[.-][a-z0-9]+)*\\.[a-z]{2,}$',
      '^\\+?[0-9]{1,3}(?:[ -]?\\(?[0-9]{2,4}\\)?)?(?:[ -]?[0-9]{2,4}){2,3}$',
      '^#(?:[0-9a-fA-F]{3}){1,2}$',
      '^(?:\\d{3}-)+\\d{4}$',
      `^[A-Za-z${letters}]+(?:[ '-][A-Za-z${letters}]+)*$`,
      `^[A-Za-z${letters}]+(?:\\s+[A-Za-z${letters}]+)*$`,
      "^[A-Za-zÀ-ÖØ-öø-ɏ̀-ٟ٪-ۯۺ-ۿऀ-॥॰-๏๚-๿Ḁ-ỿ぀-ヿ一-鿿가-힣][A-Za-zÀ-ÖØ-öø-ɏ̀-ٟ٪-ۯۺ-ۿऀ-॥॰-๏๚-๿Ḁ-ỿ぀-ヿ一-鿿가-힣 .,'’()&\\-]{1,99}$",
    ];
    expect(patterns.map((pattern) => [pattern.length > 1000, slowPattern(pattern)])).toEqual(patterns.map(() => [false, undefined]));
  });

  it('reports nested and overlapping repeats', () => {
    expect(
      [
        '^(a+)+$',
        '(\\w+\\s?)+',
        "^[A-Za-z]+(?:[ '-]?[A-Za-z]+)*$",
        '^(?:\\s+\\w*)*$',
        '^(?:\\d?){1,50}$',
        '^(?:\\w+|\\d+)+$',
        '^\\d+\\d+$',
        '^[À-ÿ]+[à-ÿ]+$',
        '^(?:[\\u00c0-\\u00ff]+\\s?)+$',
        '^(?:\\.a+)+(?:\\.a+)+$',
      ].map((pattern) => slowPattern(pattern)),
    ).toEqual(['nested', 'nested', 'adjacent', 'nested', 'nested', 'nested', 'adjacent', 'adjacent', 'nested', 'adjacent']);
  });

  it('reports a pattern over 1000 characters as long', () => {
    expect(slowPattern(`^[A-Za-z${letters}${letters}${letters}]+$`)).toBe('long');
  });
});
