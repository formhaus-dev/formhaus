import { onBeforeUnmount, ref, type Ref } from 'vue';

const THRESHOLD = 4;
const EDGE = 32;

export interface DragOptions {
  root: Ref<HTMLElement | undefined>;
  rows: string;
  attr?: string;
  scroller?: () => HTMLElement | null | undefined;
  drop(from: number, at: number): void;
}

export function usePointerDrag(options: DragOptions) {
  const from = ref<number | null>(null);
  const over = ref<number | null>(null);
  let origin: { x: number; y: number; index: number } | null = null;
  let suppress = false;
  let pointerY = 0;
  let frame = 0;

  function gapAt(y: number): number {
    const rows = [...(options.root.value?.querySelectorAll<HTMLElement>(options.rows) ?? [])];
    for (const row of rows) {
      const rect = row.getBoundingClientRect();
      if (y < rect.top + rect.height / 2) return Number(row.dataset[options.attr ?? 'index']);
    }
    return rows.length;
  }

  function scroll() {
    const box = options.scroller?.();
    if (!box || from.value === null) return;
    const rect = box.getBoundingClientRect();
    if (pointerY < rect.top + EDGE) box.scrollTop -= 6;
    else if (pointerY > rect.bottom - EDGE) box.scrollTop += 6;
    over.value = gapAt(pointerY);
    frame = requestAnimationFrame(scroll);
  }

  function move(event: PointerEvent) {
    if (!origin) return;
    if (from.value === null) {
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) < THRESHOLD) return;
      from.value = origin.index;
      frame = requestAnimationFrame(scroll);
    }
    event.preventDefault();
    pointerY = event.clientY;
    over.value = gapAt(event.clientY);
  }

  function up() {
    if (from.value !== null && over.value !== null) options.drop(from.value, over.value);
    suppress = from.value !== null;
    cleanup();
  }

  function key(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    suppress = from.value !== null;
    cleanup();
  }

  function cleanup() {
    cancelAnimationFrame(frame);
    origin = null;
    from.value = null;
    over.value = null;
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    window.removeEventListener('keydown', key, true);
  }

  function down(event: PointerEvent, index: number) {
    if (event.button !== 0) return;
    origin = { x: event.clientX, y: event.clientY, index };
    suppress = false;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', key, true);
  }

  function wasDrag(): boolean {
    const result = suppress;
    suppress = false;
    return result;
  }

  onBeforeUnmount(cleanup);

  return { from, over, down, wasDrag };
}
