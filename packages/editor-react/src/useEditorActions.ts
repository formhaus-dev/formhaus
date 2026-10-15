import {
  addField,
  addOption,
  addTrackingFields,
  addOptions,
  addStep,
  duplicateField,
  findField,
  isPage,
  isQuestion,
  moveField,
  moveFieldTo,
  moveOption,
  moveStep,
  pageTitle,
  referencesTo,
  removeField,
  removeOption,
  removeStep,
  splitAt,
  stepOf,
  type BuilderForm,
  type FieldPreset,
  type Placement,
  type StepRemoval,
} from '@formhaus/builder';
import { useMemo } from 'react';
import { useAnnounce } from './ui';
import { useFocusRequests } from './canvas/focus';
import { useRemovalGuard } from './logic/guard';
import { useEditorStore, useHost } from './store/context';

function neighbour(form: BuilderForm, uid: string): { kind: 'field' | 'step'; uid: string } | null {
  const index = form.blocks.findIndex((block) => block.uid === uid);
  const next = form.blocks[index + 1];
  const block = next && isQuestion(next) ? next : form.blocks[index - 1];
  if (!block) return null;
  return { kind: isQuestion(block) ? 'field' : 'step', uid: block.uid };
}

function position(form: BuilderForm, uid: string): string {
  const step = stepOf(form, uid);
  const start = step ? form.blocks.indexOf(step) + 1 : 0;
  const fields: string[] = [];
  for (let index = start; index < form.blocks.length; index++) {
    const block = form.blocks[index];
    if (!block || !isQuestion(block)) break;
    fields.push(block.uid);
  }
  const label = findField(form, uid)?.label.trim() || 'Field';
  const where = step ? ` in ${pageTitle(step, 0)}` : '';
  return `${label} moved to position ${String(fields.indexOf(uid) + 1)} of ${String(fields.length)}${where}`;
}

export function useEditorActions() {
  const store = useEditorStore();
  const announce = useAnnounce();
  const { notify } = useHost();
  const focus = useFocusRequests();
  const guard = useRemovalGuard();

  return useMemo(() => {
    const selectField = (uid: string | undefined) => {
      if (uid) store.select({ kind: 'field', uid });
      return uid;
    };
    const moved = (uid: string, ok: boolean | undefined) => {
      if (ok) announce(position(store.getState().form, uid));
    };
    return {
      addField: (at: Placement, preset?: FieldPreset) => selectField(store.update((form) => addField(form, at, preset).uid)),
      addTracking: (at: Placement) => {
        const added = store.update((form) => addTrackingFields(form, at)) ?? [];
        if (!added.length) {
          notify({ title: 'Tracking fields are already in the form' });
          return undefined;
        }
        announce(`${added.length} tracking fields added`);
        return selectField(added[0]);
      },
      duplicate: (uid: string) => {
        const copy = selectField(store.update((form) => duplicateField(form, uid)?.uid));
        if (!copy) return;
        focus.request(copy, 'label');
        announce('Field duplicated');
      },
      remove: (uid: string) => {
        const form = store.getState().form;
        const item = findField(form, uid);
        const label = item?.label.trim();
        const uses = item ? referencesTo(form, uid).filter((user) => user !== uid).length : 0;
        const run = () => {
          const next = neighbour(store.getState().form, uid);
          if (!store.update((draft) => removeField(draft, uid))) return;
          store.select(next);
          if (next) focus.request(next.uid, 'card');
          notify({ title: label ? `Deleted “${label}”` : 'Field deleted', action: { label: 'Undo', onClick: store.undo } });
        };
        if (!uses) run();
        else
          void guard(label ? `“${label}”` : 'this field', uses).then((ok) => {
            if (ok) run();
          });
      },
      move: (uid: string, delta: -1 | 1) => {
        moved(
          uid,
          store.update((form) => moveField(form, uid, delta)),
        );
      },
      moveTo: (uid: string, step: string | null, index: number) => {
        focus.request(uid, 'card');
        moved(
          uid,
          store.update((form) => moveFieldTo(form, uid, step, index)),
        );
      },
      split: (uid: string) => {
        const page = store.update((form) => splitAt(form, uid)?.uid);
        if (!page) return;
        store.select({ kind: 'step', uid: page });
        focus.request(page, 'title');
      },
      addStep: (after?: string) => {
        const page = store.update((form) => addStep(form, after).uid);
        if (page) {
          store.select({ kind: 'step', uid: page });
          focus.request(page, 'title');
        }
        return page;
      },
      removeStep: (uid: string, mode: StepRemoval) => {
        const form = store.getState().form;
        const pages = form.blocks.filter(isPage);
        const at = pages.findIndex((page) => page.uid === uid);
        const title = pages[at] ? pageTitle(pages[at], at) : 'Step';
        const fallback = pages[at - 1] ?? pages[at + 1];
        if (!store.update((draft) => removeStep(draft, uid, mode))) return;
        const target = fallback && store.getState().form.blocks.some((block) => block.uid === fallback.uid) ? fallback.uid : null;
        store.select(target ? { kind: 'step', uid: target } : null);
        if (target) focus.request(target, 'card');
        notify({ title: `Deleted “${title}”`, action: { label: 'Undo', onClick: store.undo } });
      },
      moveStep: (uid: string, delta: -1 | 1) => {
        if (store.update((form) => moveStep(form, uid, delta))) announce(delta < 0 ? 'Step moved up' : 'Step moved down');
      },
      addOption: (field: string, after?: string, label = '') => store.update((form) => addOption(form, field, after, label).uid),
      addOptions: (field: string, labels: string[], after?: string) =>
        store.update((form) => addOptions(form, field, labels, after).map((option) => option.uid)),
      removeOption: (field: string, option: string) => store.update((form) => removeOption(form, field, option)),
      moveOption: (field: string, option: string, to: number) => {
        if (store.update((form) => moveOption(form, field, option, to))) announce(`Option moved to position ${String(to + 1)}`);
      },
      edit: (recipe: (form: BuilderForm) => void, group?: string) => {
        store.update(recipe, group);
      },
    };
  }, [store, announce, notify, focus, guard]);
}

export type EditorActions = ReturnType<typeof useEditorActions>;
