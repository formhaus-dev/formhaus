import type { FormDefinition } from '@formhaus/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalHost, LOCAL_KEY, readLocalDraft } from './localHost';
import { createMemoryHost } from './memoryHost';

const definition: FormDefinition = { id: 'contact', title: 'Contact', submit: { label: 'Send' }, fields: [] };
const Preview = () => null;

describe('createLocalHost', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips a draft through localStorage', async () => {
    const host = createLocalHost({ Preview });
    expect(await host.load()).toEqual({ draft: null, published: null });
    expect(host.stored()).toBe(false);
    const saved = await host.save(definition, 0);
    expect(saved.revision).toBe(1);
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

  it('tells the user when the browser storage is full', async () => {
    const notify = vi.fn();
    const storage = {
      ...localStorage,
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    } as unknown as Storage;
    await expect(createLocalHost({ Preview, notify, storage }).save(definition, 0)).rejects.toThrow('full');
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ tone: 'danger' }));
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
