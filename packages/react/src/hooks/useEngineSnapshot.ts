import type { FormEngine } from '@formhaus/core';
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
