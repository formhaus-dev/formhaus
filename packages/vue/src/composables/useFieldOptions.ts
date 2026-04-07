import type { FieldOption, FormField } from '@formhaus/core';
import { type Ref, ref, watch } from 'vue';
import type { OptionsProvider } from '../types';

export function useFieldOptions(
  visibleFields: Ref<FormField[]>,
  values: Ref<Record<string, unknown>>,
  providers?: Record<string, OptionsProvider>,
): Ref<Record<string, FieldOption[]>> {
  const resolved = ref<Record<string, FieldOption[]>>({});

  if (!providers) return resolved;

  watch(
    [visibleFields, values],
    async () => {
      for (const field of visibleFields.value) {
        if (!field.optionsFrom) continue;

        const provider = providers[field.optionsFrom];
        if (!provider) continue;

        const result = provider(values.value);
        const options = Array.isArray(result) ? result : await result;
        resolved.value[field.key] = options;
      }
    },
    { immediate: true, deep: true },
  );

  return resolved;
}
