import { setLabel, toDefinition, type BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedDraft } from '../host';
import { createAutosave } from './autosave';
import { readBackup, writeBackup } from './backup';
import { blankForm, loader } from './initial';
import { createRecovery } from './recovery';
import { createEditorStore } from './store';

const saved = (definition: FormDefinition, revision: number): SavedDraft => ({
  definition,
  revision,
  baseVersion: null,
  savedAt: new Date().toISOString(),
  savedBy: '',
});

function setup({ mirror = true, fail = false, key = (): string => 'backup' } = {}) {
  const store = createEditorStore(blankForm());
  const state = { fail };
  const save = vi.fn((definition: FormDefinition, revision: number) =>
    state.fail ? Promise.reject(new TypeError('offline')) : Promise.resolve(saved(definition, revision + 1)),
  );
  const autosave = createAutosave(store, { adapter: { save }, revision: 0, load: loader(null) });
  const recovery = createRecovery({ store, autosave, slot: { key, mirror }, revision: 0, savedAt: null, load: loader(null) });
  const stop = recovery.start();
  autosave.start();
  const uid = store.getState().form.blocks[0]?.uid ?? '';
  const type = (label: string) => {
    store.update((form: BuilderForm) => {
      setLabel(form, uid, label);
    }, `${uid}:label`);
  };
  return { store, autosave, recovery, stop, type, state, save };
}

const label = (key: string) => readBackup(key)?.definition.fields?.[0]?.label;

describe('createRecovery', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('mirrors every edit and clears the copy once the save matches it', async () => {
    const { type } = setup();
    type('W');
    expect(label('backup')).toBe('W');
    type('Work');
    expect(label('backup')).toBe('Work');
    await vi.advanceTimersByTimeAsync(1000);
    expect(readBackup('backup')).toBeNull();
  });

  it('keeps the copy while saves fail', async () => {
    const { type, store } = setup({ fail: true });
    type('Offline');
    await vi.advanceTimersByTimeAsync(1000);
    expect(store.getState().save.status).toBe('error');
    expect(label('backup')).toBe('Offline');
  });

  it('keeps the newer copy when an edit lands during a save', async () => {
    let release: () => void = () => undefined;
    const store = createEditorStore(blankForm());
    const save = (definition: FormDefinition, revision: number) =>
      new Promise<SavedDraft>((resolve) => {
        release = () => {
          resolve(saved(definition, revision + 1));
        };
      });
    const autosave = createAutosave(store, { adapter: { save }, revision: 0, load: loader(null) });
    createRecovery({
      store,
      autosave,
      slot: { key: () => 'backup', mirror: true },
      revision: 0,
      savedAt: null,
      load: loader(null),
    }).start();
    autosave.start();
    const uid = store.getState().form.blocks[0]?.uid ?? '';
    store.update((form) => {
      setLabel(form, uid, 'A');
    });
    const first = autosave.flush();
    store.update((form) => {
      setLabel(form, uid, 'AB');
    });
    release();
    await first;
    expect(label('backup')).toBe('AB');
  });

  it('moves the copy when the host key changes', () => {
    let key = 'new';
    const { type } = setup({ key: () => key });
    type('A');
    key = 'draft-1';
    type('AB');
    expect(readBackup('new')).toBeNull();
    expect(label('draft-1')).toBe('AB');
  });

  it('does not mirror for hosts that save locally', () => {
    const { type } = setup({ mirror: false });
    type('A');
    expect(readBackup('backup')).toBeNull();
  });
});

describe('restore offer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function offered() {
    const form = blankForm();
    const definition = { ...toDefinition(form), title: 'Recovered' };
    writeBackup('backup', { definition, revision: 0, at: new Date().toISOString() });
    const store = createEditorStore(form);
    const autosave = createAutosave(store, {
      adapter: { save: (d, r) => Promise.resolve(saved(d, r + 1)) },
      revision: 0,
      load: loader(null),
    });
    const recovery = createRecovery({
      store,
      autosave,
      slot: { key: () => 'backup', mirror: true },
      revision: 0,
      savedAt: null,
      load: loader(null),
    });
    recovery.start();
    return { store, recovery };
  }

  it('offers a newer copy and restores it as one undoable step', () => {
    const { store, recovery } = offered();
    expect(recovery.offer()?.definition.title).toBe('Recovered');
    store.update((form) => {
      form.title = 'Typed meanwhile';
    });
    expect(readBackup('backup')?.definition.title).toBe('Recovered');
    recovery.restore();
    expect(recovery.offer()).toBeNull();
    expect(store.getState().form.title).toBe('Recovered');
    store.undo();
    expect(store.getState().form.title).toBe('Typed meanwhile');
  });

  it('drops the copy on discard', () => {
    const { store, recovery } = offered();
    recovery.dismiss();
    expect(recovery.offer()).toBeNull();
    expect(readBackup('backup')).toBeNull();
    expect(store.getState().form.title).toBe('Untitled form');
  });

  it('drops a copy that matches what loaded', () => {
    writeBackup('backup', { definition: toDefinition(blankForm()), revision: 0, at: new Date().toISOString() });
    const store = createEditorStore(blankForm());
    const autosave = createAutosave(store, {
      adapter: { save: (d, r) => Promise.resolve(saved(d, r + 1)) },
      revision: 0,
      load: loader(null),
    });
    const recovery = createRecovery({
      store,
      autosave,
      slot: { key: () => 'backup', mirror: true },
      revision: 0,
      savedAt: null,
      load: loader(null),
    });
    expect(recovery.offer()).toBeNull();
    expect(readBackup('backup')).toBeNull();
  });
});
