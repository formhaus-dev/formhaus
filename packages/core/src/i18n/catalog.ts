import { formatter, numberFormat, supported } from '../engine/recall-format';
import type { EngineInternals } from '../engine/runtime-internals';
import type { FormDefinition, LabelKey, LocaleSource, LocaleText, MessageKey, PluralForms, Translation } from '../types';
import { formatText, type MessageParams } from '../validation/default-messages';
import { isEntry } from '../visibility/nodes';

type Part = 'messages' | 'labels';
type Text = (key: MessageKey | LabelKey, params: MessageParams) => string | undefined;

const isTranslation = (source: LocaleSource): source is Translation => typeof (source as Translation).texts === 'function';

export const localeList = (locale: LocaleSource | LocaleSource[] | undefined): LocaleSource[] =>
  [locale ?? []].flat().filter((source): source is LocaleSource => isEntry(source));

export function catalogText(locale: string, text: LocaleText | undefined, params: MessageParams): string | undefined {
  if (!text) return undefined;
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

export const localizedTexts = (definition: FormDefinition, sources: LocaleSource[]): FormDefinition =>
  sources.filter(isTranslation).reduceRight((shown, source) => source.texts(shown), definition);

export function localeSources(
  sources: () => LocaleSource[],
  definition: () => FormDefinition,
  part: Part,
): [Text, Partial<Record<string, string>> | undefined, Text] {
  const text =
    (translated: boolean): Text =>
    (key, params) => {
      for (const source of sources()) {
        if (isTranslation(source) !== translated) continue;
        const result = isTranslation(source)
          ? source.text(definition(), part, key, params)
          : catalogText(source.locale, (source[part] as Record<string, LocaleText | undefined> | undefined)?.[key], params);
        if (result) return result;
      }
    };
  return [text(true), definition()[part], text(false)];
}

export const engineSources = (engine: EngineInternals, part: Part) =>
  localeSources(
    () => localeList(engine.lifecycle.locale),
    () => engine.definition,
    part,
  );
