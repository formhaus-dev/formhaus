import type { FormDefinition } from '@formhaus/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readBackup } from '../store/backup';
import { backupKey, carryToBuild, createLocalHost, LOCAL_KEY, readLocalDraft } from './localHost';
import { createMemoryHost } from './memoryHost';

const definition: FormDefinition = { id: 'contact', title: 'Contact', submit: { label: 'Send' }, fields: [] };
const Preview = () => null;

describe('createLocalHost', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a draft through localStorage', async () => {
    const onChange = vi.fn();
    const host = createLocalHost({ Preview, onChange });
    expect(await host.load()).toEqual({ draft: null, published: null });
    expect(host.stored()).toBe(false);
    const saved = await host.save(definition, 0);
    expect(saved.revision).toBe(1);
    expect(onChange).toHaveBeenCalledWith(definition);
    expect(host.stored()).toBe(true);
    const { draft } = await createLocalHost({ Preview }).load();
    expect(draft?.definition).toEqual(definition);
    expect(draft?.revision).toBe(1);
    await host.discard();
    expect(localStorage.getItem(LOCAL_KEY)).toBeNull();
  });

  it('ignores stored values that are not drafts', () => {
    for (const value of ['nope', '[]', '{"definition":[],"revision":1}', '{"definition":{}}']) {
      localStorage.setItem(LOCAL_KEY, value);
      expect(readLocalDraft(localStorage)).toBeNull();
    }
  });

  it('tells the user once when the browser storage is full', async () => {
    const notify = vi.fn();
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    } as unknown as Storage;
    const host = createLocalHost({ Preview, notify, storage });
    await expect(host.save(definition, 0)).rejects.toBeInstanceOf(Error);
    await expect(host.save(definition, 0)).rejects.toBeInstanceOf(Error);
    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }));
  });
});

describe('carryToBuild', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('becomes the builder draft when the builder is empty', () => {
    carryToBuild(definition);
    expect(readLocalDraft(localStorage)?.definition).toEqual(definition);
    expect(readBackup(backupKey(LOCAL_KEY))).toBeNull();
  });

  it('waits as a restore offer next to an existing builder draft', () => {
    const other = { ...definition, title: 'Other' };
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ definition: other, revision: 4, savedAt: '2026-10-12T10:00:00Z' }));
    carryToBuild(definition);
    expect(readLocalDraft(localStorage)?.definition).toEqual(other);
    expect(readBackup(backupKey(LOCAL_KEY))).toMatchObject({ definition, revision: 4 });
  });

  it('does nothing when the builder already has the same form', () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ definition, revision: 2, savedAt: '2026-10-12T10:00:00Z' }));
    carryToBuild(definition);
    expect(readBackup(backupKey(LOCAL_KEY))).toBeNull();
  });
});

describe('createMemoryHost', () => {
  it('starts from the given definition and reports changes', async () => {
    const onChange = vi.fn();
    const host = createMemoryHost({ Preview, definition, onChange });
    expect((await host.load()).draft?.definition).toEqual(definition);
    await host.save({ ...definition, title: 'New' }, 1);
    expect(onChange).toHaveBeenCalledWith({ ...definition, title: 'New' });
    expect(host.publish).toBeUndefined();
  });
});
