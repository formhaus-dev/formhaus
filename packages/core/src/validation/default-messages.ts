import type { FormField, MessageCatalog, MessageKey } from '../types';

export type { MessageCatalog, MessageKey };
export type MessageParams = Record<string, unknown>;
export type MessageFn = (key: MessageKey, params: MessageParams, field: FormField) => string | undefined;
export type MessageSource = MessageCatalog | MessageFn;
export type ResolveMessage = (key: MessageKey, params: MessageParams, field: FormField) => string;

export const DEFAULT_MESSAGES: Readonly<Record<MessageKey, string>> = Object.freeze({
  required: 'This field is required',
  minLength: 'Must be at least {min} characters',
  maxLength: 'Must be at most {max} characters',
  minItems: 'Must be at least {min} items',
  maxItems: 'Must be at most {max} items',
  min: 'Must be at least {min}',
  max: 'Must be at most {max}',
  pattern: 'Invalid format',
  matchField: 'Fields must match',
  email: 'Enter a valid email',
  number: 'Enter a number',
  date: 'Enter a valid date',
  datetime: 'Enter a valid date and time',
  option: 'Select one of the available options',
  options: 'Must be a list of available options',
  boolean: 'Must be true or false',
  string: 'Must be text',
  file: 'Must be a file reference',
  value: 'Invalid value',
});

export type ValidationRule = 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'matchField';

export function formatText(template: string, params: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match));
}

type TextSource<K extends string> = Partial<Record<K, string>> | ((key: K, params: MessageParams, ...context: never[]) => string | undefined);

export function resolveText<K extends string>(defaults: Record<K, string>, key: K, params: MessageParams, sources: (TextSource<K> | undefined)[], ...context: unknown[]): string {
  for (const source of sources) {
    const text = typeof source === 'function' ? (source as (...args: unknown[]) => unknown)(key, params, ...context) : source?.[key];
    if (text && typeof text === 'string') return typeof source === 'function' ? text : formatText(text, params);
  }
  return formatText(defaults[key], params);
}

export function messageResolver(...sources: (MessageSource | undefined)[]): ResolveMessage {
  return (key, params, field) => resolveText(DEFAULT_MESSAGES, key, params, sources, field);
}

export function getDefaultMessage(rule: ValidationRule | MessageKey, params: Record<string, unknown> = {}): string {
  const template = Object.prototype.hasOwnProperty.call(DEFAULT_MESSAGES, rule) ? DEFAULT_MESSAGES[rule] : DEFAULT_MESSAGES.value;
  const custom = params.unit !== undefined && (rule === 'minLength' || rule === 'maxLength');
  return formatText(custom ? template.replace('characters', '{unit}') : template, params);
}
