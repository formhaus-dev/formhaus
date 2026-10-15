import { findIssues, isPage, isQuestion, stepOf, toDefinition, type BuilderBlock, type BuilderForm, type Issue } from '@formhaus/builder';
import { useCallback, useDeferredValue, useMemo } from 'react';
import { useEditor } from './context';
import type { Selection } from './store';

const blockIndexes = new WeakMap<BuilderForm, Map<string, BuilderBlock>>();
const issueIndexes = new WeakMap<BuilderForm, Map<string, Issue[]>>();

function blockOf(form: BuilderForm, uid: string): BuilderBlock | undefined {
  let index = blockIndexes.get(form);
  if (!index) {
    index = new Map();
    for (const block of form.blocks) if (!index.has(block.uid)) index.set(block.uid, block);
    blockIndexes.set(form, index);
  }
  return index.get(uid);
}

function issuesOf(form: BuilderForm): Map<string, Issue[]> {
  let byUid = issueIndexes.get(form);
  if (!byUid) {
    byUid = new Map();
    for (const issue of findIssues(form)) byUid.set(issue.uid, [...(byUid.get(issue.uid) ?? []), issue]);
    issueIndexes.set(form, byUid);
  }
  return byUid;
}

export const useForm = () => useEditor((state) => state.form);
export const useField = (uid: string) =>
  useEditor(
    useCallback(
      (state) => {
        const block = blockOf(state.form, uid);
        return isQuestion(block) ? block : undefined;
      },
      [uid],
    ),
  );
export const useStep = (uid: string) =>
  useEditor(
    useCallback(
      (state) => {
        const block = blockOf(state.form, uid);
        return isPage(block) ? block : undefined;
      },
      [uid],
    ),
  );
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
  return issuesOf(useDeferredValue(useForm()));
}

export function useErrors(uid: string): string[] {
  const errors = useEditor(
    useCallback(
      (state) =>
        JSON.stringify((issuesOf(state.form).get(uid) ?? []).filter((issue) => issue.severity === 'error').map((issue) => issue.message)),
      [uid],
    ),
  );
  return useMemo(() => JSON.parse(errors) as string[], [errors]);
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
