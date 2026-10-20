import { describe, expect, it } from 'vitest';
import { imageSource, optionTexts } from '../../src/internal';

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

describe('imageSource', () => {
  it('keeps relative, blob, http, https and raster data images', () => {
    const allowed = [
      '/assets/a.png',
      './a@2x.png',
      'a.png',
      '//cdn.example.com/a.png',
      'blob:https://example.com/3f1c',
      'http://localhost:5173/a.png',
      'HTTPS://example.com/a@b.png?x=1',
      'data:image/png;base64,iVBORw0KGgo=',
      'data:image/webp,x',
    ];
    expect(allowed.map(imageSource)).toEqual(allowed);
  });

  it('drops script, file, non-raster data and credential URLs', () => {
    const refused = [
      undefined,
      '',
      ' ',
      'javascript:alert(1)',
      ' JaVa\tScRiPt:alert(1)',
      '\u0001javascript:alert(1)',
      'vbscript:msgbox(1)',
      'data:text/html,<script>',
      'data:image/svg+xml;base64,PHN2Zz4=',
      'file:///etc/hosts',
      'https://user:pass@example.com/a.png',
      'http:user@example.com/a.png',
      '//user@example.com/a.png',
    ];
    expect(refused.map(imageSource)).toEqual(refused.map(() => undefined));
  });
});
