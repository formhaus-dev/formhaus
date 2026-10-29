import { validDefinition } from '../definition-validation/check-definition';
import { FormDefinitionError, isError } from '../definition-validation/issues';
import { checkTranslations } from './check';
import type { FormDefinition, LabelFn, LocaleSource, LocaleText, TranslateSource, Translation } from '../types';
import { firstText, formatText, type MessageFn } from '../validation/default-messages';
import { catalogText, localeList, localeSources, localizedTexts } from './catalog';
import { CATALOGS } from './nodes';
import { lookup, type Overlay } from './overlay';
import { definitionSlots, type Slot } from './slots';
import { translator } from './translate';

export type TranslationFile = Overlay & { locale: string };

export interface Localized {
  definition: FormDefinition;
  messages: MessageFn;
  labels: LabelFn;
}

function applied(input: FormDefinition, locale: string, text: (slot: Slot, definition: FormDefinition) => string | undefined) {
  const definition: FormDefinition = JSON.parse(JSON.stringify(input));
  definition.lang = locale;
  for (const slot of definitionSlots(definition)) {
    const result = text(slot, definition);
    if (result !== undefined) slot.apply(result);
  }
  return definition;
}

function fileTranslation(file: TranslationFile): Translation {
  return {
    locale: file.locale,
    texts: (input) =>
      applied(input, file.locale, (slot) => {
        const text = lookup(file, slot.address);
        return text !== undefined && slot.kind === 'rule' ? formatText(text, slot.params) : text;
      }),
    text: (_definition, part, key, params) =>
      catalogText(file.locale, (file[part] as Record<string, LocaleText | undefined> | undefined)?.[key], params),
  };
}

function keyTranslation(source: TranslateSource): Translation {
  return {
    locale: source.locale,
    texts: (input) =>
      applied(input, source.locale, (slot, definition) => {
        if (slot.kind !== 'text' && slot.kind !== 'rule') return undefined;
        const text = translator(definition, source)(slot.key, slot.address, slot.params, slot.fallback);
        return text !== undefined && (slot.source !== undefined || text !== slot.fallback) ? text : undefined;
      }),
    text: (definition, part, key, params) => {
      const own = (definition[part] as Record<string, string> | undefined)?.[key];
      const fallback = formatText(own ?? (CATALOGS[part] as Record<string, string>)[key], params);
      const explicit = (definition.i18n?.[part] as Record<string, string> | undefined)?.[key];
      const text = translator(definition, source)(explicit, [part, key], params, fallback);
      return text === fallback ? undefined : text;
    },
  };
}

export const translation = (source: TranslationFile | TranslateSource): Translation =>
  typeof (source as TranslateSource).translate === 'function'
    ? keyTranslation(source as TranslateSource)
    : fileTranslation(source as TranslationFile);

export function localize(input: FormDefinition, locale: LocaleSource | LocaleSource[]): Localized {
  const errors = checkTranslations(validDefinition(input)).filter(isError);
  if (errors.length) throw new FormDefinitionError(errors);
  const sources = localeList(locale);
  const definition = localizedTexts(input, sources);
  const chain = (part: 'messages' | 'labels') =>
    localeSources(
      () => sources,
      () => definition,
      part,
    );
  const [messages, labels] = [chain('messages'), chain('labels')];
  return {
    definition,
    messages: (key, params) => firstText(key, params, messages),
    labels: (key, params) => firstText(key, params, labels),
  };
}
