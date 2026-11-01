import type { FormEngine } from '../engine';
import { isPlainEntry } from '../validation/type-checks';
import { itemPath } from '../visibility/nodes';

type Values = Record<string, unknown>;

export type DirtySource = Pick<FormEngine<object>, 'getSubmitValues' | 'subscribe' | 'reset' | 'resets'>;

export interface DirtyTracker {
  readonly dirty: boolean;
  readonly dirtyKeys: readonly string[];
  markClean(): void;
  reset(values?: Record<string, unknown>): void;
  subscribe(listener: () => void): () => void;
  stop(): void;
}

const keysOf = (...objects: Values[]) => new Set(objects.flatMap((object) => Object.keys(object)));

function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => same(item, b[index]));
  return (
    isPlainEntry(a) && isPlainEntry(b) && [...keysOf(a as Values, b as Values)].every((key) => same((a as Values)[key], (b as Values)[key]))
  );
}

const itemList = (value: unknown): value is Values[] => Array.isArray(value) && value.every(isPlainEntry);

function changedKeys(baseline: Values, values: Values): string[] {
  const keys: string[] = [];
  for (const key of keysOf(baseline, values)) {
    const before = baseline[key];
    const after = values[key];
    if (same(before, after)) continue;
    if (!itemList(before) || !itemList(after) || before.length !== after.length) keys.push(key);
    else
      before.forEach((item, index) => {
        for (const field of keysOf(item, after[index])) if (!same(item[field], after[index][field])) keys.push(itemPath(key, index, field));
      });
  }
  return keys.sort();
}

export function trackDirty(engine: DirtySource): DirtyTracker {
  const listeners = new Set<() => void>();
  let baseline: Values;
  let resets: number;
  let keys: readonly string[] = [];
  const markClean = () => {
    baseline = engine.getSubmitValues() as Values;
    resets = engine.resets;
    update();
  };
  const update = () => {
    if (resets !== engine.resets) return markClean();
    const next = changedKeys(baseline, engine.getSubmitValues() as Values);
    if (next.length === keys.length && next.every((key, index) => key === keys[index])) return;
    keys = next;
    for (const listener of listeners) listener();
  };
  markClean();
  const stop = engine.subscribe(update);
  return {
    get dirty() {
      return keys.length > 0;
    },
    get dirtyKeys() {
      return keys;
    },
    markClean,
    reset: (values) => engine.reset(values),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    stop,
  };
}
