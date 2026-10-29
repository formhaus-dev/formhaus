import { formatter, numberFormat, supported } from '../engine/recall-format';
import type { EngineInternals } from '../engine/runtime-internals';
import type { FormDefinition, LabelKey, LocaleCatalog, LocaleSource, LocaleText, MessageKey, PluralForms, Translation } from '../types';
import { formatText, type MessageParams } from '../validation/default-messages';
import { isEntry } from '../visibility/nodes';

type Part = 'messages' | 'labels';
type Text = (key: MessageKey | LabelKey, params: MessageParams) => string | undefined;

export interface TranslationParts {
  key: unknown[];
  texts(definition: FormDefinition): FormDefinition;
  text(definition: FormDefinition, part: Part, key: string, params: MessageParams): string | undefined;
}

const PARTS = Symbol.for('formhaus.translation');

export const defineTranslation = (locale: string, parts: TranslationParts): Translation =>
  ({ locale, [PARTS]: parts }) as unknown as Translation;

const partsOf = (source: LocaleSource): TranslationParts | undefined => (source as unknown as Record<symbol, TranslationParts>)[PARTS];

export const localeList = (locale: LocaleSource | LocaleSource[] | undefined): LocaleSource[] =>
  [locale ?? []].flat().filter((source): source is LocaleSource => isEntry(source));

export const localeKey = (sources: LocaleSource[]): unknown[] => sources.flatMap((source) => partsOf(source)?.key ?? [source]);

export const catalogEntry = (source: object, part: Part, key: string): LocaleText | undefined =>
  ((source as Partial<LocaleCatalog>)[part] as Record<string, LocaleText | undefined> | undefined)?.[key];

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
  sources.reduceRight((shown, source) => partsOf(source)?.texts(shown) ?? shown, definition);

export function localeSources(
  sources: () => LocaleSource[],
  definition: () => FormDefinition,
  part: Part,
): [Text, Partial<Record<string, string>> | undefined, Text] {
  const text =
    (translated: boolean): Text =>
    (key, params) => {
      for (const source of sources()) {
        const parts = partsOf(source);
        if (!!parts !== translated) continue;
        const result = parts
          ? parts.text(definition(), part, key, params)
          : catalogText(source.locale, catalogEntry(source, part, key), params);
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

const FORM_TEXTS = ['title', 'description', 'fields', 'steps', 'sections', 'submit', 'cancel'];

export const untranslated = (sources: LocaleSource[]): boolean =>
  sources.some((source) => !partsOf(source) && FORM_TEXTS.some((key) => key in source));
