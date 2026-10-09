import { computed, nextTick, onScopeDispose, ref, watch } from 'vue';
import type { BuilderForm } from './builder-model';

const LIMIT = 200;

export function useHistory(form: BuilderForm, delay = 300) {
  const past = ref<string[]>([]);
  const future = ref<string[]>([]);
  let last = JSON.stringify(form);
  let muted = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function commit() {
    clearTimeout(timer);
    const now = JSON.stringify(form);
    if (now === last) return;
    past.value.push(last);
    if (past.value.length > LIMIT) past.value.shift();
    future.value = [];
    last = now;
  }

  function apply(snapshot: string) {
    muted = true;
    clearTimeout(timer);
    Object.assign(form, JSON.parse(snapshot));
    last = snapshot;
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
    const snapshot = past.value.pop();
    if (snapshot === undefined) return;
    future.value.push(last);
    apply(snapshot);
  }

  function redo() {
    commit();
    const snapshot = future.value.pop();
    if (snapshot === undefined) return;
    past.value.push(last);
    apply(snapshot);
  }

  function replace(next: BuilderForm) {
    commit();
    const snapshot = JSON.stringify(next);
    if (snapshot === last) return;
    past.value.push(last);
    future.value = [];
    apply(snapshot);
  }

  onScopeDispose(() => clearTimeout(timer));

  function onKey(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
    event.preventDefault();
    if (event.shiftKey) redo();
    else undo();
  }

  return { undo, redo, replace, onKey, canUndo: computed(() => past.value.length > 0), canRedo: computed(() => future.value.length > 0) };
}
