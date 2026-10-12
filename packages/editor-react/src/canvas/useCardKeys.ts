import type { KeyboardEvent } from 'react';
import { useEditorStore } from '../store/context';
import type { EditorActions } from '../useEditorActions';
import { focusCard, neighbourCard, useFocusRequests } from './focus';

export function useCardKeys(uid: string, actions: EditorActions) {
  const store = useEditorStore();
  const focus = useFocusRequests();

  return (event: KeyboardEvent<HTMLElement>, editing: boolean) => {
    if (store.getState().readOnly) return;
    const mod = event.metaKey || event.ctrlKey;
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      event.stopPropagation();
      focus.request(uid, editing ? 'label' : 'card');
      actions.move(uid, event.key === 'ArrowUp' ? -1 : 1);
      return;
    }
    if (mod && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      event.stopPropagation();
      actions.duplicate(uid);
      return;
    }
    if (editing || event.target !== event.currentTarget) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      focusCard(uid, 'label');
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      const next = neighbourCard(event.currentTarget, 1) ?? neighbourCard(event.currentTarget, -1);
      actions.remove(uid);
      next?.click();
      next?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const next = neighbourCard(event.currentTarget, event.key === 'ArrowDown' ? 1 : -1);
      if (!next) return;
      event.preventDefault();
      next.click();
      next.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      store.select(null);
      event.currentTarget.blur();
    }
  };
}
