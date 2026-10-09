import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

export type Anchor = HTMLElement | null | undefined | (() => HTMLElement | null | undefined);
export type Side = 'top' | 'bottom';
export interface Placement { side: Side; align: 'start' | 'end' | 'center'; gap?: number }
export interface Position { x: number; y: number; side: Side }

const MARGIN = 8;

export function resolve(anchor: Anchor): HTMLElement | null {
  return (typeof anchor === 'function' ? anchor() : anchor) ?? null;
}

export function place(rect: DOMRect, width: number, height: number, placement: Placement): Position {
  const gap = placement.gap ?? 6;
  const fits = (side: Side) => (side === 'top' ? rect.top - gap - height >= MARGIN : rect.bottom + gap + height <= window.innerHeight - MARGIN);
  const side = fits(placement.side) || !fits(placement.side === 'top' ? 'bottom' : 'top') ? placement.side : placement.side === 'top' ? 'bottom' : 'top';
  const y = side === 'top' ? rect.top - gap - height : rect.bottom + gap;
  const base = placement.align === 'end' ? rect.right - width : placement.align === 'center' ? rect.left + rect.width / 2 - width / 2 : rect.left;
  const x = Math.min(Math.max(base, MARGIN), Math.max(MARGIN, window.innerWidth - MARGIN - width));
  return { x, y: Math.max(MARGIN, y), side };
}

export function useFloating(anchor: () => Anchor, el: Ref<HTMLElement | undefined>, placement: Placement | (() => Placement)) {
  const settings = () => (typeof placement === 'function' ? placement() : placement);
  const position = ref<Position>({ x: 0, y: 0, side: settings().side });
  let frame = 0;

  function update() {
    const target = resolve(anchor());
    if (!target || !el.value) return;
    position.value = place(target.getBoundingClientRect(), el.value.offsetWidth, el.value.offsetHeight, settings());
  }

  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }

  onMounted(async () => {
    await nextTick();
    update();
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
  });

  watch(anchor, schedule);

  return { position, update: schedule };
}
