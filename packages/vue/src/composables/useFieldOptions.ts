import type { FieldOption, FormEngine } from '@formhaus/core';
import { loadOptions, type OptionSource, sameOptions } from '@formhaus/core/internal';
import { type Ref, ref, watch } from 'vue';
import type { OptionsProvider } from '../types';

export function useFieldOptions(
  optionSources: Ref<OptionSource[]>,
  getEngine: () => FormEngine,
  getProviders: () => Record<string, OptionsProvider> | undefined,
): Ref<Record<string, FieldOption[]>> {
  const resolved = ref<Record<string, FieldOption[]>>({});
  const requestVersions = new Map<string, number>();
  let current: FormEngine | undefined;

  watch(
    [optionSources, getEngine, getProviders],
    ([sources, engine, providers], _previous, onCleanup) => {
      if (current !== engine) {
        if (current) resolved.value = {};
        current = engine;
      }
      if (!providers) return;
      let active = true;
      const unsubscribers: Array<() => void> = [];

      const commit = (key: string, options: FieldOption[]) => {
        if (!active || sameOptions(resolved.value[key], options)) return;
        resolved.value = { ...resolved.value, [key]: options };
      };

      for (const [key, field] of sources) {
        const provider = field.optionsFrom && providers[field.optionsFrom];
        if (!provider) continue;
        const resolve = () => loadOptions(key, provider, engine.values, requestVersions, commit);
        resolve();
        for (const dependency of new Set(field.optionsDependsOn ?? [])) {
          unsubscribers.push(engine.subscribeField(dependency, resolve));
        }
      }

      onCleanup(() => {
        active = false;
        for (const unsubscribe of unsubscribers) unsubscribe();
      });
    },
    { immediate: true },
  );

  return resolved;
}
