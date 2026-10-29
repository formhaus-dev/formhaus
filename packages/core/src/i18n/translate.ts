import type { FormDefinition, LocaleSource, TranslateSource } from '../types';
import { formatText } from '../validation/default-messages';

export type Ask = (
  explicit: string | undefined,
  address: string[],
  params: Record<string, unknown>,
  fallback: string,
) => string | undefined;

export const isTranslate = (source: LocaleSource): source is TranslateSource => typeof source.translate === 'function';

export function translationKey(prefix: string | false, explicit: string | undefined, address: string[]): string | undefined {
  if (explicit !== undefined) return explicit;
  if (prefix === false) return undefined;
  return (prefix ? [prefix, ...address] : address).join('.');
}

export function translator(definition: FormDefinition, { translate, prefix = definition.id }: TranslateSource): Ask {
  return (explicit, address, params, fallback) => {
    const key = translationKey(prefix, explicit, address);
    let text: unknown;
    try {
      text = key === undefined ? undefined : translate(key, params, fallback);
    } catch {
      return undefined;
    }
    return typeof text === 'string' && text.trim() && text !== key ? formatText(text, params) : undefined;
  };
}
