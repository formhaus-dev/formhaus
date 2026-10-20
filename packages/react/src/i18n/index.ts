import type { FormDefinition } from '@formhaus/core';
import { localize, type Localized, type LocalizeSource } from '@formhaus/core/i18n';
import { useMemo } from 'react';

export type { Localized, LocalizeSource, Overlay, TranslateFn } from '@formhaus/core/i18n';

export function useLocalizedForm(definition: FormDefinition, source?: LocalizeSource): Localized {
  const overlay = source && 'overlay' in source ? source.overlay : undefined;
  const translate = source && 'translate' in source ? source.translate : undefined;
  const prefix = source && 'prefix' in source ? source.prefix : undefined;
  return useMemo(
    () => (source ? localize(definition, source) : { definition, messages: {}, labels: {} }),
    [definition, overlay, translate, prefix, source?.lang],
  );
}
