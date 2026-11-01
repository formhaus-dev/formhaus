import type { FormEngine } from '@formhaus/core';
import { type DirtyTracker, trackDirty } from '@formhaus/core/dirty';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

export interface FormDirty {
  dirty: boolean;
  dirtyKeys: readonly string[];
  markClean(): void;
  ref(handle: { readonly engine: FormEngine } | null): void;
}

const clean: readonly string[] = [];
const idle = () => () => {};

export function useFormDirty(engine?: FormEngine): FormDirty {
  const [handled, setHandled] = useState<FormEngine | null>(null);
  const [tracker, setTracker] = useState<DirtyTracker | null>(null);
  const target = engine ?? handled;
  useEffect(() => {
    const next = target && trackDirty(target);
    setTracker(next);
    return () => next?.stop();
  }, [target]);
  const ref = useCallback((handle: { readonly engine: FormEngine } | null) => setHandled(handle?.engine ?? null), []);
  const dirtyKeys = useSyncExternalStore(
    tracker?.subscribe ?? idle,
    () => tracker?.dirtyKeys ?? clean,
    () => clean,
  );
  return { dirty: dirtyKeys.length > 0, dirtyKeys, markClean: () => tracker?.markClean(), ref };
}
