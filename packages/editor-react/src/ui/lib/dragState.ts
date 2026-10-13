import { useSyncExternalStore } from 'react';

let active = false;
const listeners = new Set<() => void>();

export function setDragActive(value: boolean) {
  if (active === value) return;
  active = value;
  if (typeof document !== 'undefined') document.documentElement.toggleAttribute('data-fh-dragging', value);
  listeners.forEach((listener) => {
    listener();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDragActive() {
  return useSyncExternalStore(subscribe, () => active);
}
