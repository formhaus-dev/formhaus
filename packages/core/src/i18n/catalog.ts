import { formatter, numberFormat, supported } from '../engine/recall-format';
import type { EngineInternals } from '../engine/runtime-internals';
import type { FormDefinition, LabelKey, LocaleSource, LocaleText, MessageKey, PluralForms } from '../types';
import { formatText, type MessageParams } from '../validation/default-messages';
import { isEntry } from '../visibility/nodes';
import { CATALOGS } from './nodes';
import { isTranslate, translator } from './translate';

type Part = 'messages' | 'labels';

export const localeList = (locale: LocaleSource | LocaleSource[] | undefined): LocaleSource[] =>
  [locale ?? []].flat().filter((source): source is LocaleSource => isEntry(source));

function catalogText(locale: string, text: LocaleText, params: MessageParams): string | undefined {
  const tag = supported(locale);
  const name = ['count', 'min', 'max'].find((key) => typeof params[key] === 'number');
  const values = { ...params };
  let form = 'other';
  if (name)
    try {
      form = formatter('plural', tag, () => new Intl.PluralRules(tag)).select(params[name] as number);
      values[name] = numberFormat(tag).format(params[name] as number);
    } catch {}
  const chosen = typeof text === 'string' ? text : (text[form as keyof PluralForms] ?? text.other);
  return typeof chosen === 'string' ? formatText(chosen, values) : undefined;
}

function sourceText(definition: FormDefinition, source: LocaleSource, part: Part, key: string, params: MessageParams) {
  if (!isTranslate(source)) {
    const text = (source[part] as Record<string, LocaleText | undefined> | undefined)?.[key];
    return text ? catalogText(source.locale, text, params) : undefined;
  }
  const own = (definition[part] as Record<string, string> | undefined)?.[key];
  const fallback = formatText(own ?? (CATALOGS[part] as Record<string, string>)[key], params);
  const explicit = (definition.i18n?.[part] as Record<string, string> | undefined)?.[key];
  const text = translator(definition, source)(explicit, [part, key], params, fallback);
  return text === fallback ? undefined : text;
}

export const localeText =
  (sources: () => LocaleSource[], definition: () => FormDefinition, part: Part) =>
  (key: MessageKey | LabelKey, params: MessageParams): string | undefined => {
    for (const source of sources()) {
      const text = sourceText(definition(), source, part, key, params);
      if (text) return text;
    }
  };

export const localeSource = (engine: EngineInternals, part: Part) =>
  localeText(
    () => localeList(engine.lifecycle.locale),
    () => engine.definition,
    part,
  );
