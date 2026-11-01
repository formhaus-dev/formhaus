import type { FormEngine } from '@formhaus/core';
import { type DirtyTracker, trackDirty } from '@formhaus/core/dirty';
import { type ComputedRef, computed, type MaybeRefOrGetter, onScopeDispose, shallowRef, toValue, watch } from 'vue';

type EngineSource = FormEngine | { readonly engine: FormEngine } | null | undefined;

export interface FormDirty {
  dirty: ComputedRef<boolean>;
  dirtyKeys: ComputedRef<readonly string[]>;
  markClean(): void;
  ref(handle: unknown): void;
}

const engineOf = (source: EngineSource) => (source && 'engine' in source ? source.engine : source);

export function useFormDirty(engine?: MaybeRefOrGetter<EngineSource>): FormDirty {
  const handle = shallowRef<{ readonly engine: FormEngine } | null>(null);
  const keys = shallowRef<readonly string[]>([]);
  let tracker: DirtyTracker | undefined;
  watch(
    () => engineOf(toValue(engine)) ?? handle.value?.engine,
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
    ref: (next) => {
      handle.value = (next as { readonly engine: FormEngine } | null) ?? null;
    },
  };
}
