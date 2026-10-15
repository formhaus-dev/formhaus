import { type RefObject, useCallback, useLayoutEffect, useRef } from 'react';

function restore(target: number) {
  let frames = 0;
  const step = () => {
    window.scrollTo(0, target);
    frames += 1;
    if (Math.abs(window.scrollY - target) > 1 && frames < 60) requestAnimationFrame(step);
  };
  step();
}

export function useTabScroll(mode: string, top: RefObject<HTMLElement | null>) {
  const positions = useRef(new Map<string, number>());
  const shown = useRef(mode);
  const skip = useRef(false);
  const remember = useCallback((keep = true) => {
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
      restore(saved);
      return;
    }
    const node = top.current;
    if (!node) return;
    const offset = Number.parseFloat(getComputedStyle(node).getPropertyValue('--fh-ed-layout-topbar')) || 0;
    const start = node.getBoundingClientRect().top + window.scrollY - offset;
    if (window.scrollY > start) window.scrollTo(0, Math.max(0, start));
  }, [mode, top]);
  return remember;
}
