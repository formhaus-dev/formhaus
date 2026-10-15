import type { BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useEditorHandle } from '../store/context';
import { useForm, useReadOnly } from '../store/hooks';
import { loader } from '../store/initial';
import { mountJsonEditor, type JsonEditorHandle } from './jsonEditor';
import { formatDefinition, parseJson, plainDefinition, sameDefinition, type JsonError } from './sync';

export const JSON_DELAY = 400;

export type JsonSyncState = ReturnType<typeof useJsonSync>;

export function useJsonSync(host: RefObject<HTMLDivElement | null>) {
  const { store, published } = useEditorHandle();
  const form = useForm();
  const readOnly = useReadOnly();
  const load = useMemo(() => loader(published), [published]);
  const [error, setError] = useState<JsonError | null>(null);
  const [checked, setChecked] = useState<FormDefinition | null>(null);
  const [ready, setReady] = useState(false);
  const editor = useRef<JsonEditorHandle | null>(null);
  const shown = useRef<BuilderForm | null>(null);
  const pending = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const sync = useMemo(() => {
    const report = (next: JsonError | null) => {
      setError(next);
      editor.current?.setError(next);
    };
    const flush = () => {
      window.clearTimeout(timer.current);
      const text = pending.current;
      pending.current = null;
      if (text === null) return;
      const parsed = parseJson(text, load);
      if ('error' in parsed) {
        report(parsed.error);
        return;
      }
      report(null);
      setChecked(parsed.definition);
      const current = store.getState().form;
      if (sameDefinition(parsed.form, current)) {
        shown.current = current;
        return;
      }
      shown.current = parsed.form;
      store.replace(parsed.form);
    };
    const show = (next: BuilderForm) => {
      window.clearTimeout(timer.current);
      pending.current = null;
      shown.current = next;
      editor.current?.setDoc(formatDefinition(next));
      report(null);
      setChecked(null);
    };
    return {
      flush,
      show,
      change: (text: string) => {
        pending.current = text;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(flush, JSON_DELAY);
      },
      apply: (change: (definition: FormDefinition) => FormDefinition) => {
        flush();
        const text = editor.current?.getDoc();
        const parsed = text === undefined ? null : parseJson(text, load);
        const source = parsed && 'definition' in parsed ? parsed.definition : plainDefinition(store.getState().form);
        let form: BuilderForm;
        try {
          form = load(change(source));
        } catch {
          return false;
        }
        if (sameDefinition(form, store.getState().form)) return false;
        store.replace(form);
        return true;
      },
      undo: () => {
        flush();
        store.undo();
      },
      redo: () => {
        flush();
        store.redo();
      },
    };
  }, [load, store]);

  useEffect(() => {
    const parent = host.current;
    if (!parent) return;
    let alive = true;
    const start = store.getState().form;
    shown.current = start;
    void mountJsonEditor(parent, {
      doc: formatDefinition(start),
      label: 'Form definition JSON',
      readOnly,
      onChange: sync.change,
      onBlur: sync.flush,
      onUndo: sync.undo,
      onRedo: sync.redo,
    }).then((mounted) => {
      if (!alive) {
        mounted.destroy();
        return;
      }
      editor.current = mounted;
      if (store.getState().form !== start) sync.show(store.getState().form);
      setReady(true);
    });
    return () => {
      alive = false;
      sync.flush();
      editor.current?.destroy();
      editor.current = null;
    };
  }, [host, readOnly, store, sync]);

  useEffect(() => {
    if (form !== shown.current) sync.show(form);
  }, [form, sync]);

  return { error, checked, ready, apply: sync.apply };
}
