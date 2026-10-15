import type { FormDefinition } from '@formhaus/core';
import { localize, type Localized, type LocalizeSource } from '@formhaus/core/i18n';
import { type DependencyList, useMemo } from 'react';

export type { Localized, LocalizeSource, Overlay, TranslateFn } from '@formhaus/core/i18n';

export function useLocalizedForm(definition: FormDefinition, source?: LocalizeSource, deps: DependencyList = []): Localized {
  const content = source && ('overlay' in source ? source.overlay : source.prefix);
  return useMemo(
    () => (source ? localize(definition, source) : { definition, messages: {}, labels: {} }),
    [definition, !source || 'overlay' in source, content, source?.lang, ...deps],
  );
}
