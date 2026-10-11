export interface HistoryOptions {
  limit?: number;
  coalesceMs?: number;
  now?: () => number;
}

export interface History<T> {
  readonly present: T;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  push(state: T, group?: string): void;
  undo(): T | undefined;
  redo(): T | undefined;
  reset(state: T): void;
  seal(): void;
}

export function createHistory<T>(initial: T, options: HistoryOptions = {}): History<T> {
  const { limit = 200, coalesceMs = 300, now = Date.now } = options;
  let past: T[] = [];
  let future: T[] = [];
  let present = initial;
  let group: string | undefined;
  let at = 0;

  return {
    get present() {
      return present;
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    push(state, next) {
      const time = now();
      if (next === undefined || next !== group || time - at > coalesceMs) {
        past.push(present);
        if (past.length > limit) past.shift();
      }
      present = state;
      future = [];
      group = next;
      at = time;
    },
    undo() {
      const previous = past.pop();
      if (previous === undefined) return undefined;
      future.push(present);
      present = previous;
      group = undefined;
      return present;
    },
    redo() {
      const next = future.pop();
      if (next === undefined) return undefined;
      past.push(present);
      present = next;
      group = undefined;
      return present;
    },
    reset(state) {
      past = [];
      future = [];
      present = state;
      group = undefined;
    },
    seal() {
      group = undefined;
    },
  };
}

export function isUndoKey(event: { key: string; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean }): 'undo' | 'redo' | undefined {
  if (!(event.metaKey || event.ctrlKey)) return undefined;
  const key = event.key.toLowerCase();
  if (key === 'y' && event.ctrlKey && !event.metaKey) return 'redo';
  if (key !== 'z') return undefined;
  return event.shiftKey ? 'redo' : 'undo';
}
