import type { FormEngine } from '@formhaus/core';
import { engineOf, submitState } from '@formhaus/core/internal';
import { useCallback, useState, useSyncExternalStore } from 'react';

export interface SubmitState {
  submitting: boolean;
  validating: boolean;
  canSubmit: boolean;
  ref: (handle: { readonly engine: FormEngine } | null) => void;
}

export function useSubmitState(target?: FormEngine | { readonly engine: FormEngine } | null): SubmitState {
  const [handled, setHandled] = useState<FormEngine>();
  const engine = engineOf(target) ?? handled;
  const subscribe = useCallback((listener: () => void) => engine?.subscribe(listener) ?? (() => {}), [engine]);
  const snapshot = useCallback(() => engine?.getSnapshot() ?? 0, [engine]);
  useSyncExternalStore(subscribe, snapshot, snapshot);
  const ref = useCallback((handle: { readonly engine: FormEngine } | null) => setHandled(handle?.engine), []);
  return { ...submitState(engine), ref };
}
