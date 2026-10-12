import type { FormDefinition } from '@formhaus/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearBackup, readBackup, worthRestoring, writeBackup } from './backup';

const form = (title: string): FormDefinition => ({ id: 'f', title, submit: { label: 'Send' }, fields: [] });
const backup = (title: string, revision: number, at: string) => ({ definition: form(title), revision, at });

describe('worthRestoring', () => {
  it('skips a backup that matches the loaded draft', () => {
    expect(worthRestoring(backup('Same', 3, '2026-10-12T10:05:00Z'), { definition: form('Same'), revision: 3, savedAt: '2026-10-12T10:00:00Z' })).toBe(false);
  });

  it('offers a backup made on top of the loaded revision', () => {
    expect(worthRestoring(backup('Mine', 3, '2026-10-12T09:00:00Z'), { definition: form('Saved'), revision: 3, savedAt: '2026-10-12T10:00:00Z' })).toBe(true);
  });

  it('offers a backup of a form that was never saved', () => {
    expect(worthRestoring(backup('Mine', 0, '2026-10-12T09:00:00Z'), { definition: form('Blank'), revision: 0, savedAt: null })).toBe(true);
  });

  it('compares times once someone saved a newer revision', () => {
    const loaded = { definition: form('Theirs'), revision: 5, savedAt: '2026-10-12T10:00:00Z' };
    expect(worthRestoring(backup('Mine', 3, '2026-10-12T09:59:00Z'), loaded)).toBe(false);
    expect(worthRestoring(backup('Mine', 3, '2026-10-12T10:01:00Z'), loaded)).toBe(true);
  });
});

describe('backup storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips and clears a backup', () => {
    const entry = backup('Mine', 2, '2026-10-12T10:00:00Z');
    expect(writeBackup('k', entry)).toBe(true);
    expect(readBackup('k')).toEqual(entry);
    clearBackup('k');
    expect(readBackup('k')).toBeNull();
  });

  it('ignores malformed values', () => {
    for (const value of ['nope', '[]', '{"definition":{},"revision":1}', '{"definition":{},"revision":1,"at":"never"}']) {
      localStorage.setItem('k', value);
      expect(readBackup('k')).toBeNull();
    }
  });

  it('stays silent when storage is full or blocked', () => {
    const broken = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      removeItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    } as unknown as Storage;
    expect(writeBackup('k', backup('Mine', 1, '2026-10-12T10:00:00Z'), broken)).toBe(false);
    expect(readBackup('k', broken)).toBeNull();
    expect(() => {
      clearBackup('k', broken);
    }).not.toThrow();
    expect(writeBackup('k', backup('Mine', 1, '2026-10-12T10:00:00Z'), null)).toBe(false);
  });
});
