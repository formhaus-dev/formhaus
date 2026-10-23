import type { FieldOption, FormEngine } from '@formhaus/core';
import { type OptionSource, sameOptions, watchOptions } from '@formhaus/core/internal';
import { type Ref, ref, watch } from 'vue';
import type { OptionsProvider } from '../types';

export function useFieldOptions(
  optionSources: Ref<OptionSource[]>,
  getEngine: () => FormEngine,
  getProviders: () => Record<string, OptionsProvider> | undefined,
): [Ref<Record<string, FieldOption[]>>, Ref<Record<string, boolean>>] {
  const resolved = ref<Record<string, FieldOption[]>>({});
  const busy = ref<Record<string, boolean>>({});
  let current: FormEngine | undefined;

  watch(
    [optionSources, getEngine, getProviders],
    ([sources, engine, providers], _previous, onCleanup) => {
      if (current !== engine) {
        if (current) resolved.value = {};
        current = engine;
      }
      if (!providers) return;
      onCleanup(
        watchOptions(
          engine,
          sources,
          providers,
          (key, options) => {
            if (!sameOptions(resolved.value[key], options)) resolved.value = { ...resolved.value, [key]: options };
          },
          (key, loading) => {
            if (!busy.value[key] !== !loading) busy.value = { ...busy.value, [key]: loading };
          },
        ),
      );
    },
    { immediate: true },
  );

  return [resolved, busy];
}
