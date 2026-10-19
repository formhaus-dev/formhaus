import type { FormDefinition, FormField, FormGroup } from '../types';
import { BOOLEAN_TYPES, MAX_STRING_LENGTH } from '../validation/type-checks';
import { formatText } from '../validation/default-messages';
import { hasOwn, isEntry, isGroup, itemsOf } from '../visibility/nodes';
import { getAllFields } from './engine-utils';
import { formatRecallValue, type RecallFormatFn } from './recall-format';

export interface RecallItem {
  group: string;
  index: number;
}

export interface RecallOptions {
  item?: RecallItem;
  lang?: string;
  format?: RecallFormatFn;
}

export const RECALL_SLOTS = ['title', 'description', 'label', 'placeholder', 'helperText', 'itemLabel'] as const;

const TOKEN = /\\\{\{|\{\{([^{}]*)\}\}|\{(\w+)\}/g;
const KEY = /^\s*([\p{L}\p{M}\p{N}_.-]+)\s*$/u;

interface Token {
  token: string;
  key?: string;
  name?: string;
}

const tokens = (text: string) =>
  [...text.matchAll(TOKEN)].flatMap(([token, content, name]): Token[] =>
    content === undefined ? (name === undefined ? [] : [{ token, name }]) : [{ token, key: KEY.exec(content)?.[1] }],
  );

export const templateTokens = (text: string): string[] => tokens(text).map(({ token, key, name }) => name ?? (key ? `{{${key}}}` : token));

export const recallKeys = (text: string): string[] => tokens(text).flatMap(({ key }) => (key ? [key] : []));

export const reservedTokens = (text: string): string[] => tokens(text).flatMap(({ token, key, name }) => (key || name ? [] : [token]));

export const formatOf = ({ formatVersion }: Pick<FormDefinition, 'formatVersion'>): number[] =>
  String(formatVersion ?? '1.0')
    .split('.')
    .map(Number);

export function recallEnabled(definition: Pick<FormDefinition, 'formatVersion'>): boolean {
  const [major, minor = 0] = formatOf(definition);
  return major > 1 || minor >= 5;
}

function substitute(
  definition: FormDefinition,
  text: string,
  resolver: () => (key: string) => string,
  params?: Record<string, unknown>,
): string {
  if (!recallEnabled(definition)) return params ? formatText(text, params) : text;
  if (!text.includes(params ? '{' : '{{')) return text;
  const resolve = resolver();
  return text.replace(TOKEN, (token, content?: string, name?: string) => {
    if (name !== undefined) return params && hasOwn(params, name) ? String(params[name]) : token;
    if (content === undefined) return '{{';
    const key = KEY.exec(content)?.[1];
    return key ? resolve(key) : token;
  });
}

function answer(field: FormField, value: unknown): string | number | string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (isGroup(field)) return Array.isArray(value) ? value.length : undefined;
  if (BOOLEAN_TYPES.includes(field.type)) return value === true ? field.label : undefined;
  const text = (item: unknown) =>
    isEntry(item)
      ? typeof item.name === 'string'
        ? item.name
        : ''
      : (field.options?.find((option) => option.value === item)?.label ?? (typeof item === 'number' ? item : String(item)));
  if (!Array.isArray(value)) {
    const single = text(value);
    return typeof single === 'string' && !single.trim() ? undefined : single;
  }
  return value.length ? value.map((item) => String(text(item))) : undefined;
}

export function resolveRecall(
  definition: FormDefinition,
  text: string,
  values: Record<string, unknown>,
  { item, lang, format = formatRecallValue }: RecallOptions = {},
  params?: Record<string, unknown>,
): string {
  return substitute(
    definition,
    text,
    () => {
      const fields = getAllFields(definition);
      const group = item && fields.find((field): field is FormGroup => isGroup(field) && field.key === item.group);
      const entry = group && itemsOf(values[group.key])[item.index];
      const scope = isEntry(entry) ? group!.fields : [];
      return (key) => {
        const own = scope.find((field) => field.key === key);
        const source = own ? (entry as Record<string, unknown>) : values;
        const field = own ?? fields.find((candidate) => candidate.key === key);
        const value = field && hasOwn(source, key) ? answer(field, source[key]) : undefined;
        return value === undefined ? '' : format(value, field!, lang || definition.lang || 'en').slice(0, MAX_STRING_LENGTH);
      };
    },
    params,
  );
}

export function recallText(definition: FormDefinition, text: string, values: Record<string, unknown>, options?: RecallOptions): string {
  return resolveRecall(definition, text, values, options);
}

export function recallStatic(definition: FormDefinition, text: string, group?: string): string {
  return substitute(definition, text, () => {
    const fields = getAllFields(definition);
    const scope = fields.find((field): field is FormGroup => isGroup(field) && field.key === group)?.fields ?? [];
    return (key) => {
      const field = scope.find((candidate) => candidate.key === key) ?? fields.find((candidate) => candidate.key === key);
      return field ? field.label || key : '';
    };
  });
}
