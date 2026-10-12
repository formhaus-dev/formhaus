import { definitionKey, formKey } from './baseline';
import { toDefinition, type BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { SaveConflict, type SavedDraft } from '../host';
import type { EditorStore } from './store';

export interface DraftAdapter {
  save: (definition: FormDefinition, revision: number) => Promise<SavedDraft>;
  discard?: () => Promise<void>;
}

export interface AutosaveOptions {
  adapter: DraftAdapter;
  revision: number;
  load: (definition: FormDefinition) => BuilderForm;
  baseline?: string | null;
  delay?: number;
}

export interface Autosave {
  start: () => void;
  stop: () => void;
  flush: (force?: boolean) => Promise<void>;
  retry: () => void;
  resolve: (choice: 'reload' | 'overwrite') => Promise<void>;
  rebase: (revision: number) => void;
  revision: () => number;
}

export function createAutosave(
  store: EditorStore,
  { adapter, revision: start, load, baseline = null, delay = 1000 }: AutosaveOptions,
): Autosave {
  let saved = store.getState().form;
  let seen = saved;
  let revision = start;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | null = null;
  let unsubscribe: (() => void) | null = null;

  const dirty = () => store.getState().form !== saved;
  const blocked = () => store.getState().readOnly || store.getState().save.status === 'conflict';

  function schedule() {
    clearTimeout(timer);
    if (!unsubscribe || blocked() || !dirty()) return;
    if (store.getState().save.status !== 'saving') store.setSave({ status: 'pending' });
    timer = setTimeout(() => void flush(), delay);
  }

  async function run() {
    const form = store.getState().form;
    store.setSave({ status: 'saving' });
    try {
      const definition = toDefinition(form);
      if (baseline !== null && adapter.discard && definitionKey(definition) === baseline) {
        if (revision > 0) await adapter.discard();
        revision = 0;
        saved = form;
        store.setSave({ status: 'idle', savedAt: null });
        return;
      }
      const draft = await adapter.save(definition, revision);
      revision = draft.revision;
      saved = form;
      store.setSave({ status: 'saved', savedAt: new Date(draft.savedAt) });
    } catch (error) {
      if (error instanceof SaveConflict) store.setSave({ status: 'conflict', conflict: error.remote });
      else store.setSave({ status: 'error' });
    }
  }

  async function flush(force = false): Promise<void> {
    clearTimeout(timer);
    if (running) {
      await running;
      return (dirty() || force) && !blocked() ? flush(force) : undefined;
    }
    if (blocked() || (!dirty() && !force)) return;
    running = run().finally(() => {
      running = null;
    });
    await running;
    if (store.getState().save.status === 'saved') schedule();
  }

  async function resolve(choice: 'reload' | 'overwrite') {
    const remote = store.getState().save.conflict;
    if (!remote) return;
    revision = remote.revision;
    if (choice === 'reload') {
      store.replace(load(remote.definition));
      saved = store.getState().form;
      store.setSave({ status: 'saved', conflict: null, savedAt: new Date(remote.savedAt) });
      return;
    }
    store.setSave({ status: 'pending', conflict: null });
    await flush();
  }

  function onChange() {
    const { form } = store.getState();
    if (form === seen) return;
    seen = form;
    schedule();
  }

  return {
    start() {
      unsubscribe ??= store.subscribe(onChange);
      onChange();
      if (baseline !== null && revision > 0 && formKey(store.getState().form) === baseline) void flush(true);
    },
    stop() {
      clearTimeout(timer);
      unsubscribe?.();
      unsubscribe = null;
    },
    flush,
    retry() {
      if (store.getState().save.status === 'error') void flush();
    },
    resolve,
    rebase(next) {
      revision = next;
      saved = store.getState().form;
      store.setSave({ status: 'saved', savedAt: new Date(), conflict: null });
    },
    revision: () => revision,
  };
}
