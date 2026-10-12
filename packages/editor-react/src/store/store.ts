import { createHistory, findField, findStep, type BuilderForm } from '@formhaus/builder';
import { freeze, produce } from 'immer';
import type { SavedDraft } from '../host';

export type Selection = { kind: 'field' | 'step'; uid: string } | { kind: 'form' };

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error' | 'conflict';

export interface SaveState {
  status: SaveStatus;
  savedAt: Date | null;
  conflict: SavedDraft | null;
}

export interface EditorState {
  form: BuilderForm;
  selection: Selection | null;
  expanded: string | null;
  canUndo: boolean;
  canRedo: boolean;
  save: SaveState;
  readOnly: boolean;
}

export interface EditorStore {
  getState: () => EditorState;
  subscribe: (listener: () => void) => () => void;
  update: <T>(recipe: (form: BuilderForm) => T, group?: string) => T | undefined;
  select: (selection: Selection | null) => void;
  expand: (uid: string | null) => void;
  undo: () => void;
  redo: () => void;
  seal: () => void;
  replace: (form: BuilderForm) => void;
  setSave: (save: Partial<SaveState>) => void;
}

function exists(form: BuilderForm, selection: Selection | null): boolean {
  if (!selection || selection.kind === 'form') return true;
  return selection.kind === 'field' ? !!findField(form, selection.uid) : !!findStep(form, selection.uid);
}

export function createEditorStore(initial: BuilderForm, options: { readOnly?: boolean } = {}): EditorStore {
  const history = createHistory(freeze(initial, true));
  const listeners = new Set<() => void>();
  let state: EditorState = {
    form: history.present,
    selection: null,
    expanded: null,
    canUndo: false,
    canRedo: false,
    save: { status: 'idle', savedAt: null, conflict: null },
    readOnly: options.readOnly ?? false,
  };

  function set(next: Partial<EditorState>) {
    state = { ...state, ...next };
    for (const listener of listeners) listener();
  }

  function settle(form: BuilderForm) {
    set({ form, canUndo: history.canUndo, canRedo: history.canRedo, selection: exists(form, state.selection) ? state.selection : null });
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update(recipe, group) {
      if (state.readOnly) return undefined;
      let result: ReturnType<typeof recipe> | undefined;
      const next = produce(state.form, (draft) => {
        result = recipe(draft);
      });
      if (next !== state.form) {
        history.push(next, group);
        settle(next);
      }
      return result;
    },
    select(selection) {
      if (selection === state.selection) return;
      history.seal();
      const keep = !!selection && (selection.kind === 'form' ? 'form' : selection.uid) === state.expanded;
      set({ selection, expanded: keep ? state.expanded : null });
    },
    expand(uid) {
      if (uid !== state.expanded) set({ expanded: uid });
    },
    undo() {
      const form = history.undo();
      if (form) settle(form);
    },
    redo() {
      const form = history.redo();
      if (form) settle(form);
    },
    seal: () => {
      history.seal();
    },
    replace(form) {
      const next = freeze(form, true);
      history.push(next);
      history.seal();
      settle(next);
    },
    setSave(save) {
      set({ save: { ...state.save, ...save } });
    },
  };
}
