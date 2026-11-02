import type { FormEngine } from '@formhaus/core';
import { engineOf, submitState } from '@formhaus/core/internal';
import { type ComputedRef, computed, type MaybeRefOrGetter, shallowRef, toValue, watch } from 'vue';

type EngineSource = FormEngine | { readonly engine: FormEngine } | null | undefined;

export interface SubmitState {
  submitting: ComputedRef<boolean>;
  validating: ComputedRef<boolean>;
  canSubmit: ComputedRef<boolean>;
  ref: (handle: unknown) => void;
}

export function useSubmitState(target?: MaybeRefOrGetter<EngineSource>): SubmitState {
  const handle = shallowRef<EngineSource>(null);
  const version = shallowRef(0);
  const engine = computed(() => engineOf(toValue(target)) ?? engineOf(handle.value));
  watch(
    engine,
    (next, _, onCleanup) => {
      if (next)
        onCleanup(
          next.subscribe(() => {
            version.value++;
          }),
        );
    },
    { immediate: true, flush: 'sync' },
  );
  const status = computed(() => {
    void version.value;
    return submitState(engine.value);
  });
  return {
    submitting: computed(() => status.value.submitting),
    validating: computed(() => status.value.validating),
    canSubmit: computed(() => status.value.canSubmit),
    ref: (next) => {
      handle.value = (next as EngineSource) ?? null;
    },
  };
}
