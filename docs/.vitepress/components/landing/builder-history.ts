import { computed, nextTick, onScopeDispose, ref, watch } from 'vue';
import { createHistory, isUndoKey, type BuilderForm } from '@formhaus/builder';

export function useHistory(form: BuilderForm, delay = 300) {
  const history = createHistory(JSON.stringify(form));
  const version = ref(0);
  let muted = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function commit() {
    clearTimeout(timer);
    const now = JSON.stringify(form);
    if (now === history.present) return;
    history.push(now);
    version.value += 1;
  }

  function apply(snapshot: string | undefined) {
    if (snapshot === undefined) return;
    muted = true;
    clearTimeout(timer);
    Object.assign(form, JSON.parse(snapshot));
    version.value += 1;
    nextTick(() => { muted = false; });
  }

  watch(
    () => form,
    () => {
      if (muted) return;
      clearTimeout(timer);
      timer = setTimeout(commit, delay);
    },
    { deep: true },
  );

  function undo() {
    commit();
    apply(history.undo());
  }

  function redo() {
    commit();
    apply(history.redo());
  }

  function replace(next: BuilderForm) {
    commit();
    const snapshot = JSON.stringify(next);
    if (snapshot === history.present) return;
    history.push(snapshot);
    apply(snapshot);
  }

  onScopeDispose(() => clearTimeout(timer));

  function onKey(event: KeyboardEvent) {
    const action = isUndoKey(event);
    if (!action || (event.ctrlKey && event.key.toLowerCase() === 'y')) return;
    event.preventDefault();
    if (action === 'redo') redo();
    else undo();
  }

  const canUndo = computed(() => version.value >= 0 && history.canUndo);
  const canRedo = computed(() => version.value >= 0 && history.canRedo);
  return { undo, redo, replace, onKey, canUndo, canRedo };
}
