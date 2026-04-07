import type { FieldOption, FormField } from '@formhaus/core';
import { useEffect, useRef, useState } from 'react';
import type { OptionsProvider } from '../types';

export function useFieldOptions(
  fields: FormField[],
  values: Record<string, unknown>,
  providers?: Record<string, OptionsProvider>,
): Record<string, FieldOption[]> {
  const [resolved, setResolved] = useState<Record<string, FieldOption[]>>({});
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!providers) return;

    for (const field of fields) {
      if (!field.optionsFrom) continue;

      const provider = providers[field.optionsFrom];
      if (!provider) continue;

      const depsKey = (field.optionsDependsOn ?? []).map((k) => values[k]).join('|');
      const cacheKey = `${field.key}:${depsKey}`;

      if (pendingRef.current.has(cacheKey)) continue;
      pendingRef.current.add(cacheKey);

      const result = provider(values);

      if (Array.isArray(result)) {
        setResolved((prev) => ({ ...prev, [field.key]: result }));
        pendingRef.current.delete(cacheKey);
      } else {
        result.then((options) => {
          setResolved((prev) => ({ ...prev, [field.key]: options }));
          pendingRef.current.delete(cacheKey);
        });
      }
    }
  }, [fields, values, providers]);

  return resolved;
}
