import type { FormDefinition, FormField, FormGroup } from '../types';
import { BOOLEAN_TYPES, MAX_STRING_LENGTH } from '../validation/type-checks';
import { hasOwn, isEntry, isGroup, itemsOf } from '../visibility/nodes';
import { getAllFields } from './engine-utils';

export interface RecallItem {
  group: string;
  index: number;
}

export const RECALL_SLOTS = ['title', 'description', 'label', 'placeholder', 'helperText'] as const;

const TOKEN = /\{\{\s*([^\s{}]+)\s*\}\}/g;

export const recallKeys = (text: string): string[] => [...text.matchAll(TOKEN)].map((match) => match[1]);

export const formatOf = ({ formatVersion }: Pick<FormDefinition, 'formatVersion'>): number[] =>
  String(formatVersion ?? '1.0')
    .split('.')
    .map(Number);

export function recallEnabled(definition: Pick<FormDefinition, 'formatVersion'>): boolean {
  const [major, minor = 0] = formatOf(definition);
  return major > 1 || minor >= 5;
}

function display(field: FormField, value: unknown): string {
  if (value === undefined || value === null) return '';
  if (isGroup(field)) return Array.isArray(value) ? String(value.length) : '';
  if (BOOLEAN_TYPES.includes(field.type)) return value === true ? field.label : '';
  const text = (item: unknown) =>
    isEntry(item)
      ? typeof item.name === 'string'
        ? item.name
        : ''
      : (field.options?.find((option) => option.value === item)?.label ?? String(item));
  return (Array.isArray(value) ? value : [value]).map(text).join(', ');
}

export function recallText(definition: FormDefinition, text: string, values: Record<string, unknown>, item?: RecallItem): string {
  if (!text.includes('{{') || !recallEnabled(definition)) return text;
  const fields = getAllFields(definition);
  const group = item && fields.find((field): field is FormGroup => isGroup(field) && field.key === item.group);
  const entry = group && itemsOf(values[group.key])[item.index];
  const scope = isEntry(entry) ? group!.fields : [];
  return text.replace(TOKEN, (_, key: string) => {
    const own = scope.find((field) => field.key === key);
    const source = own ? (entry as Record<string, unknown>) : values;
    const field = own ?? fields.find((candidate) => candidate.key === key);
    return field && hasOwn(source, key) ? display(field, source[key]).slice(0, MAX_STRING_LENGTH) : '';
  });
}
