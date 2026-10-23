import { formatter, numberFormat, supported } from '../engine/recall-format';
import type { EngineInternals } from '../engine/runtime-internals';
import type { LabelKey, LocaleText, MessageKey, PluralForms } from '../types';
import { formatText, type MessageParams } from '../validation/default-messages';

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

export const localeSource =
  (engine: EngineInternals, part: 'messages' | 'labels') =>
  (key: MessageKey | LabelKey, params: MessageParams): string | undefined => {
    for (const catalog of [engine.lifecycle.locale ?? []].flat()) {
      const text = (catalog?.[part] as Record<string, LocaleText | undefined> | undefined)?.[key];
      const result = text && catalogText(catalog.locale, text, params);
      if (result) return result;
    }
  };
