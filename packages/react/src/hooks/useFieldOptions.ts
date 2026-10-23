import type { FieldOption, FormEngine } from '@formhaus/core';
import { type OptionSource, sameOptions, watchOptions } from '@formhaus/core/internal';
import { useEffect, useState } from 'react';
import type { OptionsProvider } from '../types';

export function useFieldOptions(
  sources: OptionSource[],
  engine: FormEngine,
  providers?: Record<string, OptionsProvider>,
): [Record<string, FieldOption[]>, Record<string, boolean>] {
  const [resolved, setResolved] = useState<Record<string, FieldOption[]>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!providers) {
      setResolved((previous) => (Object.keys(previous).length > 0 ? {} : previous));
      return;
    }
    return watchOptions(
      engine,
      sources,
      providers,
      (key, options) => setResolved((previous) => (sameOptions(previous[key], options) ? previous : { ...previous, [key]: options })),
      (key, loading) => setBusy((previous) => (!previous[key] === !loading ? previous : { ...previous, [key]: loading })),
    );
  }, [engine, sources, providers]);

  return [resolved, busy];
}
