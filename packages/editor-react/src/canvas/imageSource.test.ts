import { describe, expect, it } from 'vitest';
import { LINK_ERROR, MAX_IMAGE_BYTES, SIZE_ERROR, TYPE_ERROR, checkImageFile, httpsLink, isEmbedded, summarize } from './imageSource';

const file = (type: string, size: number) => new File([new Uint8Array(size)], 'room.png', { type });

describe('option image sources', () => {
  it.each([
    ['image/png', 10, null],
    ['image/jpeg', MAX_IMAGE_BYTES, null],
    ['image/webp', 10, null],
    ['image/gif', 10, null],
    ['image/svg+xml', 10, TYPE_ERROR],
    ['text/html', 10, TYPE_ERROR],
    ['image/png', 0, TYPE_ERROR],
    ['image/png', MAX_IMAGE_BYTES + 1, SIZE_ERROR],
  ])('checks a %s file of %i bytes', (type, size, expected) => {
    expect(checkImageFile(file(type, size))).toBe(expected);
  });

  it.each([
    ['https://cdn.example.com/a.png', 'https://cdn.example.com/a.png'],
    ['  HTTPS://cdn.example.com/a b.png ', 'https://cdn.example.com/a%20b.png'],
    ['https://user:secret@cdn.example.com/a.png', 'https://cdn.example.com/a.png'],
    ['https://token@cdn.example.com/a.png', 'https://cdn.example.com/a.png'],
    ['http://cdn.example.com/a.png', null],
    ['data:image/png;base64,AAAA', null],
    ['data:image/svg+xml,%3Csvg/%3E', null],
    ['javascript:alert(1)', null],
    ['//cdn.example.com/a.png', null],
    ['https://', null],
    ['room.png', null],
  ])('accepts only https links: %s', (value, expected) => {
    expect(httpsLink(value)).toBe(expected);
  });

  it('names images without showing their source', () => {
    expect(summarize('data:image/svg+xml,%3Csvg/%3E', false)).toEqual({ title: 'Embedded image' });
    expect(summarize('https://forms.example/a/w/1f.png', true)).toEqual({ title: 'Uploaded image' });
    expect(summarize('https://cdn.example.com/rooms/sea%20view.jpg?w=400', false)).toEqual({
      title: 'sea view.jpg',
      detail: 'cdn.example.com',
    });
    expect(summarize('https://cdn.example.com/', false)).toEqual({ title: 'cdn.example.com' });
    expect(isEmbedded(' DATA:image/png;base64,AA')).toBe(true);
    expect(LINK_ERROR).toBe('Use an https link or upload the image');
  });
});
