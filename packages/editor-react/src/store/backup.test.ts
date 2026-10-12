import type { FormDefinition } from '@formhaus/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { BACKUP_LIFETIME, clearBackup, clearBackups, readBackup, worthRestoring, writeBackup, type Backup } from './backup';

const form = (title: string): FormDefinition => ({ id: 'f', title, submit: { label: 'Send' }, fields: [] });
const backup = (title: string, revision: number, base: Partial<Backup> = {}): Backup => ({
  definition: form(title),
  revision,
  at: new Date().toISOString(),
  version: 1,
  draft: 'd1',
  ...base,
});
const loaded = (title: string, revision: number, version: number | null = 1, draft: string | null = 'd1') => ({
  definition: form(title),
  revision,
  version,
  draft,
});

describe('worthRestoring', () => {
  it('skips a backup that matches the loaded draft', () => {
    expect(worthRestoring(backup('Same', 3), loaded('Same', 3))).toBe(false);
  });

  it('offers a backup made on top of the loaded revision of the same draft', () => {
    expect(worthRestoring(backup('Mine', 3), loaded('Saved', 3))).toBe(true);
  });

  it('offers a backup of a form that was never saved', () => {
    expect(worthRestoring(backup('Mine', 0, { version: null, draft: null }), loaded('Blank', 0, null, null))).toBe(true);
  });

  it('skips a backup once someone saved a newer revision', () => {
    expect(worthRestoring(backup('Mine', 3), loaded('Theirs', 5))).toBe(false);
  });

  it('skips a backup after another user published a new version', () => {
    expect(worthRestoring(backup('Mine', 3, { version: 1 }), loaded('Version 2', 0, 2, null))).toBe(false);
    expect(worthRestoring(backup('Mine', 3, { version: 1 }), loaded('Version 2 draft', 1, 2, 'd2'))).toBe(false);
  });

  it('skips a backup after the draft was discarded and a new draft started', () => {
    expect(worthRestoring(backup('Mine', 4, { draft: 'd1' }), loaded('Published', 0, 1, null))).toBe(false);
    expect(worthRestoring(backup('Mine', 4, { draft: 'd1' }), loaded('Fresh draft', 1, 1, 'd2'))).toBe(false);
  });
});

describe('backup storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips and clears a backup', () => {
    const entry = backup('Mine', 2);
    expect(writeBackup('k', entry)).toBe(true);
    expect(readBackup('k')).toEqual(entry);
    clearBackup('k');
    expect(readBackup('k')).toBeNull();
  });

  it('drops backups older than seven days', () => {
    const entry = backup('Mine', 2, { at: '2026-10-01T10:00:00Z' });
    writeBackup('k', entry);
    expect(readBackup('k', localStorage, Date.parse('2026-10-08T09:00:00Z'))).toEqual(entry);
    expect(readBackup('k', localStorage, Date.parse('2026-10-01T10:00:00Z') + BACKUP_LIFETIME + 1)).toBeNull();
    expect(localStorage.getItem('k')).toBeNull();
  });

  it('clears every backup under a prefix', () => {
    writeBackup('fh:backup:a', backup('A', 1));
    writeBackup('fh:backup:b', backup('B', 1));
    localStorage.setItem('other', 'kept');
    clearBackups('fh:backup:');
    expect(Object.keys(localStorage)).toEqual(['other']);
  });

  it('ignores malformed values', () => {
    for (const value of [
      'nope',
      '[]',
      '{"definition":{},"revision":1}',
      '{"definition":{},"revision":1,"at":"never","version":null,"draft":null}',
    ]) {
      localStorage.setItem('k', value);
      expect(readBackup('k')).toBeNull();
    }
  });

  it('stays silent when storage is full or blocked', () => {
    const denied = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    const broken = {
      length: 1,
      key: denied,
      getItem: denied,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      removeItem: denied,
    } as unknown as Storage;
    expect(writeBackup('k', backup('Mine', 1), broken)).toBe(false);
    expect(readBackup('k', broken)).toBeNull();
    expect(() => {
      clearBackup('k', broken);
      clearBackups('fh:', broken);
    }).not.toThrow();
    expect(writeBackup('k', backup('Mine', 1), null)).toBe(false);
  });
});
