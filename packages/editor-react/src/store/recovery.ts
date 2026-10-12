import { toDefinition, type BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import type { BackupSlot } from '../host';
import type { Autosave } from './autosave';
import { clearBackup, readBackup, sameDefinition, worthRestoring, writeBackup, type Backup } from './backup';
import type { EditorStore } from './store';

export interface Recovery {
  offer: () => Backup | null;
  subscribe: (listener: () => void) => () => void;
  restore: () => void;
  dismiss: () => void;
  clear: () => void;
  kept: () => boolean;
  start: () => () => void;
}

export interface RecoveryOptions {
  store: EditorStore;
  autosave: Autosave;
  slot: BackupSlot;
  revision: number;
  load: (definition: FormDefinition) => BuilderForm;
}

export const offerKey = (key: string) => `${key}:offer`;

function pickOffer(slot: BackupSlot, form: BuilderForm, revision: number): Backup | null {
  const key = slot.key();
  const loaded = { definition: toDefinition(form), revision, ...slot.base() };
  const found = [readBackup(offerKey(key)), readBackup(key)].filter(
    (backup): backup is Backup => !!backup && worthRestoring(backup, loaded),
  );
  clearBackup(key);
  clearBackup(offerKey(key));
  const newest = found.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] ?? null;
  if (newest) writeBackup(offerKey(key), newest);
  return newest;
}

export function createRecovery({ store, autosave, slot, revision, load }: RecoveryOptions): Recovery {
  const listeners = new Set<() => void>();
  const offered = slot.key();
  let offer = pickOffer(slot, store.getState().form, revision);
  let written: string | null = null;
  let stored = false;
  let seen = store.getState().form;
  let status = store.getState().save.status;

  const settle = (next: Backup | null) => {
    offer = next;
    clearBackup(offerKey(offered));
    for (const listener of listeners) listener();
  };

  function mirror(form: BuilderForm) {
    const key = slot.key();
    if (written !== null && written !== key) clearBackup(written);
    written = key;
    stored = writeBackup(key, {
      definition: toDefinition(form),
      revision: autosave.revision(),
      at: new Date().toISOString(),
      ...slot.base(),
    });
  }

  function clearIfSaved() {
    if (autosave.dirty()) return;
    const key = written ?? slot.key();
    const backup = readBackup(key);
    if (backup && sameDefinition(backup.definition, toDefinition(store.getState().form))) {
      clearBackup(key);
      stored = false;
    }
  }

  function onChange() {
    const { form, save } = store.getState();
    if (form !== seen) {
      seen = form;
      if (slot.mirror) mirror(form);
    }
    if (save.status !== status) {
      status = save.status;
      if (status === 'saved' || status === 'idle') clearIfSaved();
    }
  }

  return {
    offer: () => offer,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    restore() {
      const next = offer;
      if (!next) return;
      settle(null);
      store.replace(load(next.definition));
    },
    dismiss() {
      settle(null);
    },
    clear() {
      settle(null);
      if (written !== null) clearBackup(written);
      clearBackup(slot.key());
      stored = false;
    },
    kept: () => stored,
    start: () => store.subscribe(onChange),
  };
}
