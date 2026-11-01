import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import { keysOf, sameValue } from '../validation/same-value';
import { isPlainEntry } from '../validation/type-checks';
import { itemPath } from '../visibility/nodes';

type Values = Record<string, unknown>;

export interface DirtyTracker {
  readonly dirty: boolean;
  readonly dirtyKeys: readonly string[];
  markClean(): void;
  subscribe(listener: () => void): () => void;
  stop(): void;
}

interface Baseline {
  source: EngineInternals['source'];
  compared: EngineInternals['source'];
  values: Values;
  skipped: [string, string[]][];
  payload: Values;
}

const itemList = (value: unknown): value is Values[] => Array.isArray(value) && value.every(isPlainEntry);

function changedKeys(baseline: Values, values: Values): string[] {
  const keys: string[] = [];
  for (const key of keysOf(baseline, values)) {
    const before = baseline[key];
    const after = values[key];
    if (sameValue(before, after)) continue;
    if (!itemList(before) || !itemList(after) || before.length !== after.length) keys.push(key);
    else
      before.forEach((item, index) => {
        for (const field of keysOf(item, after[index]))
          if (!sameValue(item[field], after[index][field])) keys.push(itemPath(key, index, field));
      });
  }
  return keys.sort();
}

function replayed(engine: FormEngine<object>, { source, values, skipped }: Baseline): Values {
  const internals = engine as unknown as EngineInternals;
  const { validators, hiddenValues } = internals.lifecycle;
  const shadow = new (engine.constructor as typeof FormEngine)(source, values, { validators, hiddenValues, onWarning: () => {} });
  for (const [id, keys] of skipped) (shadow as unknown as EngineInternals).skipped.set(id, keys);
  shadow.replaceDefinition(internals.source);
  return shadow.getSubmitValues();
}

export function trackDirty(engine: FormEngine<object>): DirtyTracker {
  const internals = engine as unknown as EngineInternals;
  const listeners = new Set<() => void>();
  let baseline: Baseline;
  let resetCount: number;
  let keys: readonly string[] = [];
  const markClean = () => {
    baseline = {
      source: internals.source,
      compared: internals.source,
      values: { ...engine.getValuesSnapshot() },
      skipped: [...internals.skipped],
      payload: engine.getSubmitValues() as Values,
    };
    resetCount = engine.resetCount;
    update();
  };
  const update = () => {
    if (resetCount !== engine.resetCount) return markClean();
    if (baseline.compared !== internals.source) baseline = { ...baseline, compared: internals.source, payload: replayed(engine, baseline) };
    const next = changedKeys(baseline.payload, engine.getSubmitValues() as Values);
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
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    stop,
  };
}
