import { describe, expect, it } from 'vitest';
import { optionTexts } from '../../src/internal';

const unique = (texts: string[]) => new Set(texts).size === texts.length;

describe('optionTexts', () => {
  it('keeps unique labels', () => {
    expect(
      optionTexts([
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]),
    ).toEqual(['A', 'B']);
  });

  it('adds the value to a repeated label', () => {
    expect(
      optionTexts([
        { value: 'b', label: 'A' },
        { value: 'c', label: 'A' },
      ]),
    ).toEqual(['A (b)', 'A (c)']);
  });

  it('numbers options that share both label and value', () => {
    const options = Array.from({ length: 3 }, () => ({ value: 'b', label: 'A' }));
    expect(optionTexts(options)).toEqual(['A (b) (1)', 'A (b) (2)', 'A (b) (3)']);
  });

  it('numbers a label that matches a text with a value', () => {
    expect(
      optionTexts([
        { value: 'b', label: 'A' },
        { value: 'c', label: 'A' },
        { value: 'd', label: 'A (b)' },
      ]),
    ).toEqual(['A (b) (1)', 'A (c)', 'A (b) (2)']);
  });

  it('skips numbered texts that a label already uses', () => {
    const texts = optionTexts([
      { value: 'b', label: 'A' },
      { value: 'b', label: 'A' },
      { value: 'e', label: 'A (b) (1)' },
    ]);
    expect(texts).toEqual(['A (b) (2)', 'A (b) (3)', 'A (b) (1)']);
  });

  it('returns unique texts for many identical options', () => {
    const options = Array.from({ length: 5000 }, () => ({ value: 'x', label: 'X' }));
    expect(unique(optionTexts(options))).toBe(true);
  });
});
