import { createContext, useContext } from 'react';

export type FocusTarget = 'label' | 'card' | 'title';

export interface FocusRequests {
  request: (uid: string, target: FocusTarget) => void;
  take: (uid: string) => FocusTarget | undefined;
}

export function createFocusRequests(): FocusRequests {
  const pending = new Map<string, FocusTarget>();
  return {
    request: (uid, target) => {
      pending.set(uid, target);
    },
    take: (uid) => {
      const target = pending.get(uid);
      pending.delete(uid);
      return target;
    },
  };
}

export const FocusContext = createContext<FocusRequests>(createFocusRequests());

export const useFocusRequests = () => useContext(FocusContext);

export function focusCard(uid: string, target: FocusTarget = 'card') {
  const card = document.querySelector<HTMLElement>(`[data-card="${CSS.escape(uid)}"]`);
  const node = target === 'card' ? card : card?.querySelector<HTMLElement>('[data-focus="label"]');
  node?.focus({ preventScroll: false });
  if (target === 'title' && node instanceof HTMLTextAreaElement) node.select();
  node?.scrollIntoView({ block: 'nearest' });
}

export function neighbourCard(from: HTMLElement, delta: -1 | 1): HTMLElement | undefined {
  const cards = [...document.querySelectorAll<HTMLElement>('[data-card]')];
  return cards[cards.indexOf(from) + delta];
}

export function revealStep(uid: string, focusTitle: boolean) {
  const card = document.querySelector<HTMLElement>(`[data-card="${CSS.escape(uid)}"]`);
  if (!card) return;
  if (focusTitle) card.querySelector<HTMLElement>('[data-focus="label"]')?.focus({ preventScroll: true });
  const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.scrollIntoView({ block: 'start', behavior: instant ? 'auto' : 'smooth' });
}
