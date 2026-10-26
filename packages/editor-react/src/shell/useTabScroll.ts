import { type RefObject, useCallback, useLayoutEffect, useRef } from 'react';
import { scrollRoot, scrollToY, scrollTop } from './scroller';

const INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

function restore(scroller: HTMLElement | null, target: number): () => void {
  const root = document.documentElement.style;
  root.setProperty('overflow-anchor', 'none');
  let frame = 0;
  let timer = 0;
  let frames = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    root.removeProperty('overflow-anchor');
    for (const type of INPUT) window.removeEventListener(type, stop, true);
  };
  const step = () => {
    scrollToY(scroller, target);
    frames += 1;
    if (Math.abs(scrollTop(scroller) - target) > 1 && frames < 60) frame = requestAnimationFrame(step);
    else timer = window.setTimeout(stop, 1000);
  };
  for (const type of INPUT) window.addEventListener(type, stop, { capture: true, passive: true });
  step();
  return stop;
}

export function useTabScroll(mode: string, top: RefObject<HTMLElement | null>) {
  const positions = useRef(new Map<string, number>());
  const shown = useRef(mode);
  const skip = useRef(false);
  const cancel = useRef<() => void>(() => undefined);
  const remember = useCallback(
    (keep = true) => {
      cancel.current();
      positions.current.set(shown.current, scrollTop(scrollRoot(top.current)));
      skip.current = !keep;
    },
    [top],
  );
  useLayoutEffect(() => {
    if (shown.current === mode) return;
    shown.current = mode;
    if (skip.current) {
      skip.current = false;
      return;
    }
    const node = top.current;
    const root = scrollRoot(node);
    const saved = positions.current.get(mode);
    if (saved !== undefined) {
      cancel.current = restore(root, saved);
      return;
    }
    if (!node) return;
    const offset = Number.parseFloat(getComputedStyle(node).getPropertyValue('--fh-ed-layout-topbar')) || 0;
    const start = node.getBoundingClientRect().top - (root?.getBoundingClientRect().top ?? 0) + scrollTop(root) - offset;
    if (scrollTop(root) > start) scrollToY(root, Math.max(0, start));
  }, [mode, top]);
  useLayoutEffect(
    () => () => {
      cancel.current();
    },
    [],
  );
  return remember;
}
