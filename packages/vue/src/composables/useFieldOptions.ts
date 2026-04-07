import type { FieldOption, FormField } from '@formhaus/core';
import { type Ref, ref, watch } from 'vue';
import type { OptionsProvider } from '../types';

export function useFieldOptions(
  visibleFields: Ref<FormField[]>,
  values: Ref<Record<string, unknown>>,
  providers?: Record<string, OptionsProvider>,
): Ref<Record<string, FieldOption[]>> {
  const resolved = ref<Record<string, FieldOption[]>>({});
  const lastDeps = new Map<string, string>();

  if (!providers) return resolved;

  watch(
    [visibleFields, values],
    async () => {
      for (const field of visibleFields.value) {
        if (!field.optionsFrom) continue;

        const provider = providers[field.optionsFrom];
        if (!provider) continue;

        const depsKey = (field.optionsDependsOn ?? []).map((k) => values.value[k]).join('|');
        if (lastDeps.get(field.key) === depsKey) continue;
        lastDeps.set(field.key, depsKey);

        try {
          const result = provider(values.value);
          resolved.value[field.key] = Array.isArray(result) ? result : await result;
        } catch {
          lastDeps.delete(field.key);
        }
      }
    },
    { immediate: true },
  );

  return resolved;
}
