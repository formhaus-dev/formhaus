import type { FormEngine } from '@formhaus/core';
import { type DirtyTracker, trackDirty } from '@formhaus/core/dirty';
import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export type DirtyTarget = FormEngine | RefObject<{ readonly engine: FormEngine } | null>;

export interface FormDirty {
  dirty: boolean;
  dirtyKeys: readonly string[];
  markClean(): void;
  reset(values?: Record<string, unknown>): void;
}

const clean: readonly string[] = [];
const idle = () => () => {};
const engineOf = (target: DirtyTarget) => ('current' in target ? target.current?.engine : target);

export function useFormDirty(target: DirtyTarget): FormDirty {
  const [tracker, setTracker] = useState<DirtyTracker | null>(null);
  const tracked = useRef<{ engine: FormEngine; tracker: DirtyTracker } | null>(null);
  useEffect(() => {
    const engine = engineOf(target);
    if (tracked.current?.engine === engine) return;
    tracked.current?.tracker.stop();
    tracked.current = engine ? { engine, tracker: trackDirty(engine) } : null;
    setTracker(tracked.current?.tracker ?? null);
  });
  useEffect(
    () => () => {
      tracked.current?.tracker.stop();
      tracked.current = null;
    },
    [],
  );
  const dirtyKeys = useSyncExternalStore(
    tracker?.subscribe ?? idle,
    () => tracker?.dirtyKeys ?? clean,
    () => clean,
  );
  return {
    dirty: dirtyKeys.length > 0,
    dirtyKeys,
    markClean: () => tracker?.markClean(),
    reset: (values) => tracker?.reset(values),
  };
}
