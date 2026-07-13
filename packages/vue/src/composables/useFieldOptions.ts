import type { FieldOption, FormEngine, FormField } from '@formhaus/core';
import { type Ref, ref, watch } from 'vue';
import type { OptionsProvider } from '../types';

function optionsEqual(previous: FieldOption[] | undefined, next: FieldOption[]): boolean {
  return previous?.length === next.length && previous.every((option, index) => (
    option.value === next[index].value && option.label === next[index].label
  ));
}

export function useFieldOptions(
  visibleFields: Ref<FormField[]>,
  getEngine: () => FormEngine,
  providers?: Record<string, OptionsProvider>,
): Ref<Record<string, FieldOption[]>> {
  const resolved = ref<Record<string, FieldOption[]>>({});
  const requestVersions = new Map<string, number>();
  if (!providers) return resolved;

  watch(
    visibleFields,
    (fields, _previous, onCleanup) => {
      let active = true;
      const engine = getEngine();
      const unsubscribers: Array<() => void> = [];

      const commit = (fieldKey: string, options: FieldOption[]) => {
        if (!active || optionsEqual(resolved.value[fieldKey], options)) return;
        resolved.value = { ...resolved.value, [fieldKey]: options };
      };

      for (const field of fields) {
        const provider = field.optionsFrom && providers[field.optionsFrom];
        if (!provider) continue;
        const resolve = () => resolveOptions(
          field.key,
          provider,
          engine,
          requestVersions,
          commit,
        );
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

function resolveOptions(
  fieldKey: string,
  provider: OptionsProvider,
  engine: FormEngine,
  requestVersions: Map<string, number>,
  commit: (fieldKey: string, options: FieldOption[]) => void,
): void {
  const version = (requestVersions.get(fieldKey) ?? 0) + 1;
  requestVersions.set(fieldKey, version);
  try {
    const result = provider(engine.values);
    if (Array.isArray(result)) {
      commit(fieldKey, result);
      return;
    }
    result.then((options) => {
      if (requestVersions.get(fieldKey) === version) commit(fieldKey, options);
    }).catch(() => {});
  } catch {
    // Retry when a dependency changes.
  }
}
