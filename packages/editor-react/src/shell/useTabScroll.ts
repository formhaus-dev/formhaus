import { type RefObject, useCallback, useLayoutEffect, useRef } from 'react';

const INPUT = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;

function restore(target: number): () => void {
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
    window.scrollTo(0, target);
    frames += 1;
    if (Math.abs(window.scrollY - target) > 1 && frames < 60) frame = requestAnimationFrame(step);
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
  const remember = useCallback((keep = true) => {
    cancel.current();
    positions.current.set(shown.current, window.scrollY);
    skip.current = !keep;
  }, []);
  useLayoutEffect(() => {
    if (shown.current === mode) return;
    shown.current = mode;
    if (skip.current) {
      skip.current = false;
      return;
    }
    const saved = positions.current.get(mode);
    if (saved !== undefined) {
      cancel.current = restore(saved);
      return;
    }
    const node = top.current;
    if (!node) return;
    const offset = Number.parseFloat(getComputedStyle(node).getPropertyValue('--fh-ed-layout-topbar')) || 0;
    const start = node.getBoundingClientRect().top + window.scrollY - offset;
    if (window.scrollY > start) window.scrollTo(0, Math.max(0, start));
  }, [mode, top]);
  useLayoutEffect(
    () => () => {
      cancel.current();
    },
    [],
  );
  return remember;
}
