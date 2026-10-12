import { useEffect, useState } from 'react';
import type { EditorHost, Published } from '../host';
import { initialEditor, type InitialEditor } from './initial';

export type EditorSource =
  { status: 'loading' } | { status: 'error'; error: unknown } | { status: 'ready'; initial: InitialEditor; published: Published | null };

export function useEditorSource(host: EditorHost): EditorSource {
  const [source, setSource] = useState<EditorSource>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    host.load().then(
      ({ draft, published }) => {
        if (live) setSource({ status: 'ready', initial: initialEditor(published, draft), published });
      },
      (error: unknown) => {
        if (live) setSource({ status: 'error', error });
      },
    );
    return () => {
      live = false;
    };
  }, [host]);
  return source;
}
