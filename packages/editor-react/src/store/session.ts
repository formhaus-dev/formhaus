import { useEffect, useState } from 'react';
import type { EditorHost, Published } from '../host';
import { createAutosave } from './autosave';
import type { EditorHandle } from './context';
import { baselineOf } from './baseline';
import { loader, type InitialEditor } from './initial';
import { isUnsaved, trackLeave } from './leave';
import { createRecovery } from './recovery';
import { createEditorStore } from './store';

export interface SessionOptions {
  host: EditorHost;
  initial: InitialEditor;
  published: Published | null;
}

function createSession({ host, initial, published }: SessionOptions): EditorHandle {
  const store = createEditorStore(initial.form, { readOnly: host.readOnly });
  if (initial.savedAt && initial.revision > 0) store.setSave({ status: 'saved', savedAt: new Date(initial.savedAt) });
  const load = loader(published);
  const autosave = host.readOnly
    ? null
    : createAutosave(store, { adapter: host, revision: initial.revision, load, baseline: baselineOf(published) });
  const recovery =
    autosave && host.backup
      ? createRecovery({ store, autosave, slot: host.backup, revision: initial.revision, savedAt: initial.savedAt, load })
      : null;
  const discard = async () => {
    await host.discard();
    recovery?.clear();
    store.setSave({ status: 'idle', savedAt: null });
  };
  return { store, autosave, host: { ...host, discard }, published, recovery };
}

export function useEditorSession(options: SessionOptions): EditorHandle {
  const [session] = useState(() => createSession(options));

  useEffect(() => {
    const { autosave, recovery, host } = session;
    if (!autosave) return undefined;
    const stopRecovery = recovery?.start();
    const untrack = trackLeave(session);
    autosave.start();
    const hide = () => {
      if (document.visibilityState === 'hidden') void autosave.flush();
    };
    const leave = (event: BeforeUnloadEvent) => {
      if (!host.ephemeral && isUnsaved(session)) event.preventDefault();
    };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', hide);
    window.addEventListener('beforeunload', leave);
    window.addEventListener('online', autosave.retry);
    return () => {
      autosave.stop();
      void autosave.flush();
      stopRecovery?.();
      untrack();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('beforeunload', leave);
      window.removeEventListener('online', autosave.retry);
    };
  }, [session]);

  return session;
}
