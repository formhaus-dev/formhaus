import { validDefinition } from '../definition-validation/check-definition';
import { FormDefinitionError, isError } from '../definition-validation/issues';
import { checkTranslations } from './check';
import type { FormDefinition, LabelFn, LocaleSource } from '../types';
import { formatText, type MessageFn } from '../validation/default-messages';
import { localeList, localeText } from './catalog';
import { lookup } from './overlay';
import { CATALOGS } from './nodes';
import { formSlots, type Slot } from './slots';
import { isTranslate, translator } from './translate';

export interface Localized {
  definition: FormDefinition;
  messages: MessageFn;
  labels: LabelFn;
}

function slotText(definition: FormDefinition, source: LocaleSource, slot: Slot): string | undefined {
  if (isTranslate(source)) {
    const text = translator(definition, source)(slot.key, slot.address, slot.params, slot.fallback);
    return text !== undefined && (slot.source !== undefined || text !== slot.fallback) ? text : undefined;
  }
  const text = lookup(source, slot.address);
  return text !== undefined && slot.kind === 'rule' ? formatText(text, slot.params) : text;
}

export function localizeTexts(input: FormDefinition, sources: LocaleSource[]): FormDefinition {
  if (!sources.length) return input;
  const definition: FormDefinition = JSON.parse(JSON.stringify(input));
  if (typeof sources[0].locale === 'string' && sources[0].locale) definition.lang = sources[0].locale;
  const first = (read: (source: LocaleSource) => string | undefined) => {
    for (const source of sources) {
      const text = read(source);
      if (text !== undefined) return text;
    }
  };
  for (const slot of formSlots(definition)) {
    const text = first((source) => slotText(definition, source, slot));
    if (text !== undefined) slot.apply(text);
  }
  for (const part of ['messages', 'labels'] as const)
    for (const key of Object.keys(CATALOGS[part])) {
      const text = first((source) => (isTranslate(source) ? undefined : lookup(source, [part, key])));
      if (text !== undefined) ((definition[part] ??= {}) as Record<string, string>)[key] = text;
    }
  return definition;
}

export function localize(input: FormDefinition, locale: LocaleSource | LocaleSource[]): Localized {
  const errors = checkTranslations(validDefinition(input)).filter(isError);
  if (errors.length) throw new FormDefinitionError(errors);
  const sources = localeList(locale);
  const definition = localizeTexts(input, sources);
  const text = (part: 'messages' | 'labels') =>
    localeText(
      () => sources,
      () => definition,
      part,
    );
  return { definition, messages: text('messages'), labels: text('labels') };
}
