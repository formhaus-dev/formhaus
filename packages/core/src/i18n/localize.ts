import { parseDefinition } from '../definition-validation/check-definition';
import { FormDefinitionError, isError } from '../definition-validation/issues';
import { checkTranslations } from './check';
import type { FormDefinition, LabelFn, LabelSource } from '../types';
import { DEFAULT_MESSAGES, formatText, type MessageFn, type MessageSource } from '../validation/default-messages';
import { DEFAULT_LABELS } from './nodes';
import { lookup, type Overlay } from './overlay';
import { definitionSlots } from './slots';

export type TranslateFn = (key: string, params: Record<string, unknown>, defaultText: string) => string | undefined;

export interface OverlaySource {
  overlay: Overlay;
  lang?: string;
}

export interface TranslateSource {
  translate: TranslateFn;
  prefix?: string | false;
  lang?: string;
}

export type LocalizeSource = OverlaySource | TranslateSource;

export interface Localized {
  definition: FormDefinition;
  messages: MessageSource;
  labels: LabelSource;
}

export function translationKey(prefix: string | false, explicit: string | undefined, address: string[]): string | undefined {
  if (explicit !== undefined) return explicit;
  if (prefix === false) return undefined;
  return (prefix ? [prefix, ...address] : address).join('.');
}

function fromOverlay(definition: FormDefinition, overlay: Overlay): Localized {
  for (const slot of definitionSlots(definition)) {
    const text = lookup(overlay, slot.address);
    if (text !== undefined) slot.apply(slot.kind === 'rule' ? formatText(text, slot.params) : text);
  }
  return { definition, messages: definition.messages ?? {}, labels: definition.labels ?? {} };
}

function fromTranslate(definition: FormDefinition, { translate, prefix = definition.id }: TranslateSource): Localized {
  const ask = (explicit: string | undefined, address: string[], params: Record<string, unknown>, fallback: string) => {
    const key = translationKey(prefix, explicit, address);
    let text: unknown;
    try {
      text = key === undefined ? undefined : translate(key, params, fallback);
    } catch {
      return undefined;
    }
    return typeof text === 'string' && text.trim() && text !== key ? formatText(text, params) : undefined;
  };
  const source = { messages: { ...definition.messages }, labels: { ...definition.labels } };
  const keys = definition.i18n ?? {};
  for (const slot of definitionSlots(definition)) {
    if (slot.kind !== 'text' && slot.kind !== 'rule') continue;
    const text = ask(slot.key, slot.address, slot.params, slot.fallback);
    if (text !== undefined && (slot.source !== undefined || text !== slot.fallback)) slot.apply(text);
  }
  const catalog =
    <K extends string>(name: 'messages' | 'labels', defaults: Record<K, string>) =>
    (key: K, params: Record<string, unknown>) => {
      const own = (source[name] as Partial<Record<K, string>>)[key];
      const fallback = formatText(own ?? defaults[key], params);
      const text = ask((keys[name] as Partial<Record<K, string>> | undefined)?.[key], [name, key], params, fallback);
      return own === undefined && text === fallback ? undefined : text;
    };
  const messages: MessageFn = catalog('messages', DEFAULT_MESSAGES);
  const labels: LabelFn = catalog('labels', DEFAULT_LABELS);
  return { definition, messages, labels };
}

export function localize(input: FormDefinition, source: LocalizeSource): Localized {
  const errors = checkTranslations(parseDefinition(input)).filter(isError);
  if (errors.length) throw new FormDefinitionError(errors);
  const definition: FormDefinition = JSON.parse(JSON.stringify(input));
  if (source.lang) definition.lang = source.lang;
  return 'overlay' in source ? fromOverlay(definition, source.overlay) : fromTranslate(definition, source);
}
