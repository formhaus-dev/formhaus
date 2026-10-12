import { findField, findIssues, findStep, stepOf, toDefinition, type Issue } from '@formhaus/builder';
import { useCallback, useDeferredValue, useMemo } from 'react';
import { useEditor } from './context';
import type { Selection } from './store';

export const useForm = () => useEditor((state) => state.form);
export const useField = (uid: string) => useEditor(useCallback((state) => findField(state.form, uid), [uid]));
export const useStep = (uid: string) => useEditor(useCallback((state) => findStep(state.form, uid), [uid]));
export const useSelection = () => useEditor((state) => state.selection);
export const useSave = () => useEditor((state) => state.save);
export const useIsExpanded = (uid: string) => useEditor(useCallback((state) => state.expanded === uid, [uid]));
export const useReadOnly = () => useEditor((state) => state.readOnly);
export const useCanUndo = () => useEditor((state) => state.canUndo);
export const useCanRedo = () => useEditor((state) => state.canRedo);

export function useIsSelected(selection: Selection): boolean {
  return useEditor(
    useCallback(
      (state) => {
        const current = state.selection;
        if (!current || current.kind !== selection.kind) return false;
        return current.kind === 'form' || (selection.kind !== 'form' && current.uid === selection.uid);
      },
      [selection],
    ),
  );
}

export function useDefinition() {
  const form = useDeferredValue(useForm());
  return useMemo(() => toDefinition(form), [form]);
}

export function useIssues(): Map<string, Issue[]> {
  const form = useDeferredValue(useForm());
  return useMemo(() => {
    const byUid = new Map<string, Issue[]>();
    for (const issue of findIssues(form)) byUid.set(issue.uid, [...(byUid.get(issue.uid) ?? []), issue]);
    return byUid;
  }, [form]);
}

export function useStepOf(selection: Selection | null): string | null {
  return useEditor(
    useCallback(
      (state) => {
        if (!selection || selection.kind === 'form') return null;
        if (selection.kind === 'step') return selection.uid;
        return stepOf(state.form, selection.uid)?.uid ?? null;
      },
      [selection],
    ),
  );
}
