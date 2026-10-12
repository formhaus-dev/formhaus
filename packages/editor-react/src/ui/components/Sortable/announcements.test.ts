import type { Active, Over } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';
import { moveAnnouncements } from './announcements';

const labels: Record<string, string> = { a: 'Name', b: 'Email', c: 'Phone' };
const ids = ['a', 'b', 'c'];
const node = (id: string) => ({ id }) as Active & Over;

describe('moveAnnouncements', () => {
  const messages = moveAnnouncements({ label: (id) => labels[id] ?? '', position: (id) => ids.indexOf(String(id)) + 1, total: 3 });

  it('describes pickup, moves, drops and cancels with positions', () => {
    expect(messages.onDragStart({ active: node('a') })).toBe('Picked up Name, position 1 of 3');
    expect(messages.onDragOver({ active: node('a'), over: node('a') })).toBeUndefined();
    expect(messages.onDragOver({ active: node('a'), over: node('c') })).toBe('Name moved to position 3 of 3');
    expect(messages.onDragOver({ active: node('a'), over: null })).toBe('Name is outside the list');
    expect(messages.onDragEnd({ active: node('a'), over: node('b') })).toBe('Name moved to position 2 of 3');
    expect(messages.onDragEnd({ active: node('a'), over: null })).toBe('Name dropped back at position 1');
    expect(messages.onDragCancel({ active: node('b'), over: null })).toBe('Move cancelled, Email stays at position 2 of 3');
  });

  it('uses a custom sentence when given', () => {
    const custom = moveAnnouncements({
      label: (id) => labels[id] ?? '',
      position: (id) => ids.indexOf(String(id)) + 1,
      total: 3,
      describe: (label, position, total) => `${label} moved to position ${position} of ${total} in Contact`,
    });
    expect(custom.onDragEnd({ active: node('c'), over: node('a') })).toBe('Phone moved to position 1 of 3 in Contact');
  });
});
