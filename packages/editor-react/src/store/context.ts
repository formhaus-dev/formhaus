import { createContext, useContext, useSyncExternalStore } from 'react';
import type { EditorHost, Published } from '../host';
import type { Autosave } from './autosave';
import type { EditorState, EditorStore } from './store';

export interface EditorHandle {
  store: EditorStore;
  autosave: Autosave | null;
  host: EditorHost;
  published: Published | null;
}

export const EditorContext = createContext<EditorHandle | null>(null);

export function useEditorHandle(): EditorHandle {
  const handle = useContext(EditorContext);
  if (!handle) throw new Error('useEditorHandle needs an EditorContext provider');
  return handle;
}

export const useEditorStore = () => useEditorHandle().store;

export const useHost = () => useEditorHandle().host;

export function useEditor<T>(selector: (state: EditorState) => T): T {
  const { subscribe, getState } = useEditorStore();
  return useSyncExternalStore(subscribe, () => selector(getState()));
}
