import type { KeyboardEvent } from 'react';
import type { EditorStore } from '../store/store';

export function toggleSettings(store: EditorStore, uid: string, open: boolean): void {
  if (open) {
    store.expand(null);
    return;
  }
  const selection = store.getState().selection;
  const current = selection && selection.kind !== 'form' ? selection.uid : selection ? 'form' : null;
  if (current !== uid)
    store.select(
      uid === 'form'
        ? { kind: 'form' }
        : { kind: store.getState().form.blocks.find((block) => block.uid === uid)?.kind === 'page' ? 'step' : 'field', uid },
    );
  store.expand(uid);
  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>(`[data-settings="${CSS.escape(uid)}"]`)
      ?.querySelector<HTMLElement>('input:not([type=hidden]), textarea, select, button')
      ?.focus();
  });
}

const innerLayer = '[data-radix-popper-content-wrapper]:not(:has([role="tooltip"])), [role="dialog"]';

export function closeSettingsOnEscape(store: EditorStore, uid: string) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape' || !(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
    if (event.defaultPrevented && document.querySelector(innerLayer)) return;
    event.preventDefault();
    event.stopPropagation();
    document.querySelector<HTMLElement>(`[data-settings-toggle="${CSS.escape(uid)}"]`)?.focus();
    store.expand(null);
  };
}
