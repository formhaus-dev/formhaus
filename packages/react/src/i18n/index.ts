import type { FormDefinition } from '@formhaus/core';
import { localize, type Localized, type LocalizeSource, type TranslateFn } from '@formhaus/core/i18n';
import { useMemo, useRef } from 'react';

export type { Localized, LocalizeSource, Overlay, TranslateFn } from '@formhaus/core/i18n';

export interface LocalizedFormOptions {
  key?: unknown;
}

export function useLocalizedForm(definition: FormDefinition, source?: LocalizeSource, { key }: LocalizedFormOptions = {}): Localized {
  const latest = useRef(source);
  latest.current = source;
  const overlay = source && 'overlay' in source ? source.overlay : undefined;
  const translating = !!source && 'translate' in source;
  const prefix = source && 'prefix' in source ? source.prefix : undefined;
  return useMemo(() => {
    const current = latest.current;
    if (!current) return { definition, messages: {}, labels: {} };
    if ('overlay' in current) return localize(definition, current);
    const translate: TranslateFn = (...args) => {
      const now = latest.current;
      return (now && 'translate' in now ? now.translate : current.translate)(...args);
    };
    return localize(definition, { ...current, translate });
  }, [definition, overlay, translating, prefix, source?.lang, key]);
}
