import type { FormEngine } from '@formhaus/core';
import { useCallback, useSyncExternalStore } from 'react';

export function useFormSnapshot(engine: FormEngine): void {
  const subscribe = useCallback((listener: () => void) => engine.subscribe(listener), [engine]);
  const getSnapshot = useCallback(() => engine.getSnapshot(), [engine]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useStructureSnapshot(engine: FormEngine): void {
  const subscribe = useCallback(
    (listener: () => void) => engine.subscribeStructure(listener),
    [engine],
  );
  const getSnapshot = useCallback(() => engine.getStructureSnapshot(), [engine]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
