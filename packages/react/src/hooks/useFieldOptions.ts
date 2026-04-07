import type { FieldOption, FormField } from '@formhaus/core';
import { useEffect, useRef, useState } from 'react';
import type { OptionsProvider } from '../types';

export function useFieldOptions(
  fields: FormField[],
  values: Record<string, unknown>,
  providers?: Record<string, OptionsProvider>,
): Record<string, FieldOption[]> {
  const [resolved, setResolved] = useState<Record<string, FieldOption[]>>({});
  const lastDepsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!providers) return;

    let isStale = false;

    for (const field of fields) {
      if (!field.optionsFrom) continue;

      const provider = providers[field.optionsFrom];
      if (!provider) continue;

      const depsKey = (field.optionsDependsOn ?? []).map((k) => values[k]).join('|');

      if (lastDepsRef.current.get(field.key) === depsKey) continue;
      lastDepsRef.current.set(field.key, depsKey);

      const result = provider(values);

      if (Array.isArray(result)) {
        if (!isStale) setResolved((prev) => ({ ...prev, [field.key]: result }));
      } else {
        result
          .then((options) => {
            if (!isStale) setResolved((prev) => ({ ...prev, [field.key]: options }));
          })
          .catch(() => {
            lastDepsRef.current.delete(field.key);
          });
      }
    }

    return () => { isStale = true; };
  }, [fields, values, providers]);

  return resolved;
}
