import { setLabel, toDefinition, type BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackupBase, SavedDraft } from '../host';
import { createAutosave } from './autosave';
import { readBackup, writeBackup } from './backup';
import { blankForm, loader } from './initial';
import { createRecovery, offerKey } from './recovery';
import { createEditorStore, type EditorStore } from './store';

const saved = (definition: FormDefinition, revision: number): SavedDraft => ({
  definition,
  revision,
  baseVersion: null,
  savedAt: new Date().toISOString(),
  savedBy: '',
});

interface Setup {
  mirror?: boolean;
  fail?: boolean;
  key?: () => string;
  base?: () => BackupBase;
  form?: BuilderForm;
  revision?: number;
}

function setup({
  mirror = true,
  fail = false,
  key = () => 'backup',
  base = () => ({ version: 1, draft: 'd1' }),
  form,
  revision = 0,
}: Setup = {}) {
  const store = createEditorStore(form ?? blankForm());
  const state = { fail, release: (): void => undefined, hold: false };
  const save = vi.fn((definition: FormDefinition, current: number) => {
    if (state.fail) return Promise.reject(new TypeError('offline'));
    if (!state.hold) return Promise.resolve(saved(definition, current + 1));
    return new Promise<SavedDraft>((resolve) => {
      state.release = () => {
        resolve(saved(definition, current + 1));
      };
    });
  });
  const autosave = createAutosave(store, { adapter: { save }, revision, load: loader(null) });
  const recovery = createRecovery({ store, autosave, slot: { key, mirror, base }, revision, load: loader(null) });
  recovery.start();
  autosave.start();
  return { store, autosave, recovery, state };
}

function type(store: EditorStore, label: string) {
  const uid = store.getState().form.blocks[0]?.uid ?? '';
  store.update((form: BuilderForm) => {
    setLabel(form, uid, label);
  }, `${uid}:label`);
}

const label = (key: string) => readBackup(key)?.definition.fields?.[0]?.label;
const stored = (title: string, revision = 0, base: BackupBase = { version: 1, draft: 'd1' }) => {
  writeBackup('backup', { definition: { ...toDefinition(blankForm()), title }, revision, at: new Date().toISOString(), ...base });
};

describe('mirroring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => vi.useRealTimers());

  it('mirrors every edit with its base and clears the copy once the save matches it', async () => {
    const { store, recovery } = setup();
    type(store, 'W');
    expect(readBackup('backup')).toMatchObject({ version: 1, draft: 'd1', revision: 0 });
    type(store, 'Work');
    expect(label('backup')).toBe('Work');
    expect(recovery.kept()).toBe(true);
    await vi.advanceTimersByTimeAsync(1000);
    expect(readBackup('backup')).toBeNull();
    expect(recovery.kept()).toBe(false);
  });

  it('keeps the copy while saves fail', async () => {
    const { store } = setup({ fail: true });
    type(store, 'Offline');
    await vi.advanceTimersByTimeAsync(1000);
    expect(store.getState().save.status).toBe('error');
    expect(label('backup')).toBe('Offline');
  });

  it('keeps the newer copy when an edit lands during a save', async () => {
    const { store, autosave, state } = setup();
    state.hold = true;
    type(store, 'A');
    const first = autosave.flush();
    type(store, 'AB');
    state.release();
    await first;
    expect(label('backup')).toBe('AB');
  });

  it('moves the copy when the host key changes', () => {
    let key = 'new';
    const { store } = setup({ key: () => key });
    type(store, 'A');
    key = 'draft-1';
    type(store, 'AB');
    expect(readBackup('new')).toBeNull();
    expect(label('draft-1')).toBe('AB');
  });

  it('does not mirror for hosts that save locally', () => {
    const { store } = setup({ mirror: false });
    type(store, 'A');
    expect(readBackup('backup')).toBeNull();
  });
});

describe('restore offer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('offers a newer copy and restores it as one undoable step', () => {
    stored('Recovered');
    const { store, recovery } = setup();
    expect(recovery.offer()?.definition.title).toBe('Recovered');
    store.update((form) => {
      form.title = 'Typed meanwhile';
    });
    expect(readBackup('backup')?.definition.title).toBe('Typed meanwhile');
    expect(readBackup(offerKey('backup'))?.definition.title).toBe('Recovered');
    recovery.restore();
    expect(recovery.offer()).toBeNull();
    expect(readBackup(offerKey('backup'))).toBeNull();
    expect(store.getState().form.title).toBe('Recovered');
    store.undo();
    expect(store.getState().form.title).toBe('Typed meanwhile');
  });

  it('keeps the offer across a reload while it is unanswered', () => {
    stored('Recovered');
    setup();
    const again = setup();
    expect(again.recovery.offer()?.definition.title).toBe('Recovered');
  });

  it('drops the copy on discard', () => {
    stored('Recovered');
    const { store, recovery } = setup();
    recovery.dismiss();
    expect(recovery.offer()).toBeNull();
    expect(readBackup(offerKey('backup'))).toBeNull();
    expect(store.getState().form.title).toBe('Untitled form');
  });

  it('drops a copy that matches what loaded', () => {
    stored('Untitled form');
    const { recovery } = setup();
    expect(recovery.offer()).toBeNull();
    expect(readBackup('backup')).toBeNull();
  });

  it('drops a copy after another user published a new version', () => {
    stored('Mine', 3, { version: 1, draft: 'd1' });
    const { recovery } = setup({ base: () => ({ version: 2, draft: null }) });
    expect(recovery.offer()).toBeNull();
    expect(readBackup('backup')).toBeNull();
  });

  it('drops a copy after the draft was discarded and a new one started', () => {
    stored('Mine', 3, { version: 1, draft: 'd1' });
    const { recovery } = setup({ base: () => ({ version: 1, draft: 'd2' }), revision: 1 });
    expect(recovery.offer()).toBeNull();
  });
});
