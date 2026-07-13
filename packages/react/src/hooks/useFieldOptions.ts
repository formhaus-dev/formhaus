import type { FieldOption, FormEngine, FormField } from '@formhaus/core';
import { useEffect, useRef, useState } from 'react';
import type { OptionsProvider } from '../types';

function areOptionsEqual(previous: FieldOption[] | undefined, next: FieldOption[]): boolean {
  return previous?.length === next.length && previous.every((option, index) => (
    option.value === next[index].value && option.label === next[index].label
  ));
}

export function useFieldOptions(
  fields: FormField[],
  engine: FormEngine,
  providers?: Record<string, OptionsProvider>,
): Record<string, FieldOption[]> {
  const [resolved, setResolved] = useState<Record<string, FieldOption[]>>({});
  const requestVersions = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!providers) {
      setResolved((previous) => (
        Object.keys(previous).length > 0 ? {} : previous
      ));
      return;
    }

    let active = true;
    const unsubscribers: (() => void)[] = [];

    const commit = (fieldKey: string, options: FieldOption[]) => {
      if (!active) return;
      setResolved((previous) => {
        if (areOptionsEqual(previous[fieldKey], options)) return previous;
        return { ...previous, [fieldKey]: options };
      });
    };

    for (const field of fields) {
      if (!field.optionsFrom) continue;

      const provider = providers[field.optionsFrom];
      if (!provider) continue;

      const resolve = () => {
        const requestVersion = (requestVersions.current.get(field.key) ?? 0) + 1;
        requestVersions.current.set(field.key, requestVersion);

        try {
          const result = provider(engine.values);
          if (Array.isArray(result)) {
            commit(field.key, result);
            return;
          }

          result
            .then((options) => {
              if (requestVersions.current.get(field.key) === requestVersion) {
                commit(field.key, options);
              }
            })
            .catch(() => {});
        } catch {
          // Retry when a dependency changes.
        }
      };

      resolve();
      for (const dependency of new Set(field.optionsDependsOn ?? [])) {
        unsubscribers.push(engine.subscribeField(dependency, resolve));
      }
    }

    return () => {
      active = false;
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [engine, fields, providers]);

  return resolved;
}
