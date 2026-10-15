import type { FieldOption, FormEngine } from '@formhaus/core';
import { loadOptions, type OptionSource, sameOptions } from '@formhaus/core/internal';
import { useEffect, useRef, useState } from 'react';
import type { OptionsProvider } from '../types';

export function useFieldOptions(
  sources: OptionSource[],
  engine: FormEngine,
  providers?: Record<string, OptionsProvider>,
): Record<string, FieldOption[]> {
  const [resolved, setResolved] = useState<Record<string, FieldOption[]>>({});
  const requestVersions = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!providers) {
      setResolved((previous) => (Object.keys(previous).length > 0 ? {} : previous));
      return;
    }

    let active = true;
    const unsubscribers: (() => void)[] = [];

    const commit = (key: string, options: FieldOption[]) => {
      if (!active) return;
      setResolved((previous) => (sameOptions(previous[key], options) ? previous : { ...previous, [key]: options }));
    };

    for (const [key, field] of sources) {
      const provider = field.optionsFrom && providers[field.optionsFrom];
      if (!provider) continue;
      const resolve = () => loadOptions(key, provider, engine.values, requestVersions.current, commit);
      resolve();
      for (const dependency of new Set(field.optionsDependsOn ?? [])) {
        unsubscribers.push(engine.subscribeField(dependency, resolve));
      }
    }

    return () => {
      active = false;
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
  }, [engine, sources, providers]);

  return resolved;
}
