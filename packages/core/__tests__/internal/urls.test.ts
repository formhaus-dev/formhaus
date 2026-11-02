import { describe, expect, it } from 'vitest';
import { imageSource } from '../../src/internal';
import { linkSource } from '../../src/internal/urls';

describe('imageSource', () => {
  it.each([
    'https://example.com/a.png',
    'http://example.com/a.png?x=1#y',
    '/a.png',
    'a.png',
    '//example.com/a.png',
    'blob:https://example.com/id',
    'data:image/png;base64,AAAA',
    'DATA:IMAGE/JPEG,xx',
    '  https://example.com/a.png  ',
    `a${' '.repeat(200)}a`,
  ])('keeps %j', (image) => {
    expect(imageSource(image)).toBe(image);
  });

  it.each([
    undefined,
    '',
    '   ',
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    ' \tjava\nscript:alert(1)',
    '\u0000javascript:alert(1)',
    'vbscript:x',
    'file:///etc/passwd',
    'ftp://example.com/a.png',
    'data:text/html,<script>1</script>',
    'data:image/svg+xml,<svg/>',
    'data:image/png',
    'https://user@example.com/a.png',
    'https://user:pass@example.com/a.png',
    'https:\\\\user@example.com/a.png',
    '//user@example.com/a.png',
    '\\\\user@example.com/a.png',
  ])('drops %j', (image) => {
    expect(imageSource(image)).toBeUndefined();
  });

  it('drops a value that is not a string', () => {
    expect(imageSource(42 as unknown as string)).toBeUndefined();
    expect(imageSource({} as unknown as string)).toBeUndefined();
  });
});

describe('linkSource', () => {
  it.each(['https://example.com/x', 'http://example.com', '/submit', 'submit?x=1', '?x=1', '#top'])('keeps %j', (link) => {
    expect(linkSource(link)).toBe(link);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    'blob:https://example.com/x',
    'mailto:a@b.c',
    'file:///x',
    'https://u:p@example.com/',
  ])('drops %j', (link) => {
    expect(linkSource(link)).toBeUndefined();
  });
});
