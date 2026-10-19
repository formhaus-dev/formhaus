import type { FormEngine } from '@formhaus/core';
import { recallVersion, subscribeRecall } from '@formhaus/core/internal';
import { useCallback, useSyncExternalStore } from 'react';

function useEngineStore(subscribe: (listener: () => void) => () => void, getSnapshot: () => number, ...deps: unknown[]): number {
  const stableSubscribe = useCallback(subscribe, deps);
  const stableSnapshot = useCallback(getSnapshot, deps);
  return useSyncExternalStore(stableSubscribe, stableSnapshot, stableSnapshot);
}

export function useFormSnapshot(engine: FormEngine): number {
  return useEngineStore(
    (listener) => engine.subscribe(listener),
    () => engine.getSnapshot(),
    engine,
  );
}

export function useStructureSnapshot(engine: FormEngine): number {
  return useEngineStore(
    (listener) => engine.subscribeStructure(listener),
    () => engine.getStructureSnapshot(),
    engine,
  );
}

export function useFieldSnapshot(engine: FormEngine, key: string): number {
  return useEngineStore(
    (listener) => engine.subscribeField(key, listener),
    () => engine.getFieldSnapshot(key),
    engine,
    key,
  );
}

export function useRecallSnapshot(engine: FormEngine, active = true): number {
  return useEngineStore(
    (listener) => {
      if (!active) return () => {};
      const stop = engine.subscribe(listener);
      const stopRecall = subscribeRecall(engine, listener);
      return () => {
        stop();
        stopRecall();
      };
    },
    () => (active ? engine.getSnapshot() + recallVersion(engine) : 0),
    engine,
    active,
  );
}
