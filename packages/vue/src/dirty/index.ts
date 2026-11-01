import type { FormEngine } from '@formhaus/core';
import { type DirtyTracker, trackDirty } from '@formhaus/core/dirty';
import { type ComputedRef, computed, type MaybeRefOrGetter, onScopeDispose, shallowRef, toValue, watch } from 'vue';

export type DirtyTarget = FormEngine | { readonly engine: FormEngine } | null | undefined;

export interface FormDirty {
  dirty: ComputedRef<boolean>;
  dirtyKeys: ComputedRef<readonly string[]>;
  markClean(): void;
  reset(values?: Record<string, unknown>): void;
}

export function useFormDirty(target: MaybeRefOrGetter<DirtyTarget>): FormDirty {
  const keys = shallowRef<readonly string[]>([]);
  let tracker: DirtyTracker | undefined;
  const engine = () => {
    const value = toValue(target);
    return value && 'engine' in value ? value.engine : value;
  };
  watch(
    engine,
    (next) => {
      tracker?.stop();
      const own = next ? trackDirty(next) : undefined;
      tracker = own;
      keys.value = own?.dirtyKeys ?? [];
      own?.subscribe(() => {
        keys.value = own.dirtyKeys;
      });
    },
    { immediate: true, flush: 'sync' },
  );
  onScopeDispose(() => tracker?.stop());
  return {
    dirty: computed(() => keys.value.length > 0),
    dirtyKeys: computed(() => keys.value),
    markClean: () => tracker?.markClean(),
    reset: (values) => tracker?.reset(values),
  };
}
