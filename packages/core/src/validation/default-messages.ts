import type { FormField, MessageCatalog, MessageKey } from '../types';
import { hasOwn } from '../visibility/nodes';

export type MessageParams = Record<string, unknown>;
export type MessageFn = (key: MessageKey, params: MessageParams, field: FormField) => string | undefined;
export type MessageSource = MessageCatalog | MessageFn;
export type ResolveMessage = (key: MessageKey, params: MessageParams, field: FormField) => string;

export const DEFAULT_MESSAGES: Readonly<Record<MessageKey, string>> = Object.freeze({
  required: 'This field is required',
  minLength: 'Minimum length is {min}',
  maxLength: 'Maximum length is {max}',
  minItems: 'At least {min} required',
  maxItems: 'At most {max} allowed',
  min: 'Must be at least {min}',
  max: 'Must be at most {max}',
  pattern: 'Invalid format',
  matchField: 'Fields must match',
  email: 'Enter a valid email',
  number: 'Enter a number',
  date: 'Enter a valid date',
  datetime: 'Enter a valid date and time',
  time: 'Enter a valid time',
  option: 'Select one of the available options',
  options: 'Must be a list of available options',
  boolean: 'Must be true or false',
  string: 'Must be text',
  file: 'Must be a file reference',
  value: 'Invalid value',
  hidden: '{label}: {message}',
});

export type ValidationRule = 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'matchField';

export function formatText(template: string, params: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (hasOwn(params, name) ? String(params[name]) : match));
}

type TextSource<K extends string> =
  | Partial<Record<K, string>>
  | ((key: K, params: MessageParams, ...context: never[]) => string | undefined);

export function resolveText<K extends string>(
  defaults: Record<K, string>,
  key: K,
  params: MessageParams,
  sources: (TextSource<K> | undefined)[],
  ...context: unknown[]
): string {
  for (const source of sources) {
    const text = typeof source === 'function' ? (source as (...args: unknown[]) => unknown)(key, params, ...context) : source?.[key];
    if (text && typeof text === 'string') return typeof source === 'function' ? text : formatText(text, params);
  }
  return formatText(defaults[key], params);
}

export function messageResolver(...sources: (MessageSource | undefined)[]): ResolveMessage {
  return (key, params, field) => resolveText(DEFAULT_MESSAGES, key, params, sources, field);
}

export function namedResolver(resolve: ResolveMessage): ResolveMessage {
  return (key, params, field) => {
    const message = resolve(key, params, field);
    return field.type === 'hidden' ? resolve('hidden', { label: field.label || field.key, message }, field) : message;
  };
}

export function getDefaultMessage(rule: ValidationRule | MessageKey, params: Record<string, unknown> = {}): string {
  const template = hasOwn(DEFAULT_MESSAGES, rule) ? DEFAULT_MESSAGES[rule] : DEFAULT_MESSAGES.value;
  const custom = params.unit !== undefined && (rule === 'minLength' || rule === 'maxLength');
  return formatText(custom ? `At ${rule === 'minLength' ? 'least {min}' : 'most {max}'} {unit}` : template, params);
}
