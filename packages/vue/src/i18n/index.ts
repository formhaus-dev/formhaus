import type { FormDefinition } from '@formhaus/core';
import { localize, type Localized, type LocalizeSource } from '@formhaus/core/i18n';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';

export type { Localized, LocalizeSource, Overlay, TranslateFn } from '@formhaus/core/i18n';

export function useLocalizedForm(definition: MaybeRefOrGetter<FormDefinition>, source?: MaybeRefOrGetter<LocalizeSource | undefined>): ComputedRef<Localized> {
  return computed(() => {
    const value = toValue(definition);
    const active = toValue(source);
    return active ? localize(value, active) : { definition: value, messages: {}, labels: {} };
  });
}
