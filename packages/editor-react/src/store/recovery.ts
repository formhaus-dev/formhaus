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
  start: () => () => void;
}

export interface RecoveryOptions {
  store: EditorStore;
  autosave: Autosave;
  slot: BackupSlot;
  revision: number;
  savedAt: string | null;
  load: (definition: FormDefinition) => BuilderForm;
}

export function createRecovery({ store, autosave, slot, revision, savedAt, load }: RecoveryOptions): Recovery {
  const listeners = new Set<() => void>();
  const found = readBackup(slot.key());
  let offer = found && worthRestoring(found, { definition: toDefinition(store.getState().form), revision, savedAt }) ? found : null;
  if (found && !offer) clearBackup(slot.key());
  let written: string | null = null;
  let seen = store.getState().form;
  let status = store.getState().save.status;

  const settle = (next: Backup | null) => {
    offer = next;
    for (const listener of listeners) listener();
  };

  function mirror(form: BuilderForm) {
    const key = slot.key();
    if (written !== null && written !== key) clearBackup(written);
    written = key;
    writeBackup(key, { definition: toDefinition(form), revision: autosave.revision(), at: new Date().toISOString() });
  }

  function clearIfSaved() {
    if (autosave.dirty()) return;
    const key = written ?? slot.key();
    const stored = readBackup(key);
    if (stored && sameDefinition(stored.definition, toDefinition(store.getState().form))) clearBackup(key);
  }

  function onChange() {
    const { form, save } = store.getState();
    if (form !== seen) {
      seen = form;
      if (slot.mirror && !offer) mirror(form);
    }
    if (save.status !== status) {
      status = save.status;
      if (!offer && (status === 'saved' || status === 'idle')) clearIfSaved();
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
      clearBackup(slot.key());
    },
    clear() {
      settle(null);
      if (written !== null) clearBackup(written);
      clearBackup(slot.key());
    },
    start: () => store.subscribe(onChange),
  };
}
