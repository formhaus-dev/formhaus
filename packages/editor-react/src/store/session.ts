import { useEffect, useState } from 'react';
import type { EditorHost, Published } from '../host';
import { createAutosave } from './autosave';
import type { EditorHandle } from './context';
import { baselineOf } from './baseline';
import { loader, type InitialEditor } from './initial';
import { createEditorStore } from './store';

export interface SessionOptions {
  host: EditorHost;
  initial: InitialEditor;
  published: Published | null;
}

const unsaved = new Set(['pending', 'saving', 'error', 'conflict']);

function createSession({ host, initial, published }: SessionOptions): EditorHandle {
  const store = createEditorStore(initial.form, { readOnly: host.readOnly });
  if (initial.savedAt && initial.revision > 0) store.setSave({ status: 'saved', savedAt: new Date(initial.savedAt) });
  const autosave = host.readOnly
    ? null
    : createAutosave(store, { adapter: host, revision: initial.revision, load: loader(published), baseline: baselineOf(published) });
  return { store, autosave, host, published };
}

export function useEditorSession(options: SessionOptions): EditorHandle {
  const [session] = useState(() => createSession(options));

  useEffect(() => {
    const { store, autosave } = session;
    if (!autosave) return undefined;
    autosave.start();
    const hide = () => {
      if (document.visibilityState === 'hidden') void autosave.flush();
    };
    const leave = (event: BeforeUnloadEvent) => {
      if (unsaved.has(store.getState().save.status)) event.preventDefault();
    };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', hide);
    window.addEventListener('beforeunload', leave);
    window.addEventListener('online', autosave.retry);
    return () => {
      autosave.stop();
      void autosave.flush();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('beforeunload', leave);
      window.removeEventListener('online', autosave.retry);
    };
  }, [session]);

  return session;
}
