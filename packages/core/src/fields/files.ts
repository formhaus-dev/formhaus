import { labelFor } from '../i18n/labels';
import type { FormField, LabelKey } from '../types';
import { getDefaultMessage } from '../validation/default-messages';
import { fileLimit, isFileList, listedFiles } from '../validation/type-checks';

export { fileLimit, isFileList };

export const fileItems = (value: unknown): unknown[] => listedFiles(Array.isArray(value) ? value : [value]);

export const isListLike = (value: unknown): value is ArrayLike<unknown> =>
  typeof value === 'object' && value !== null && typeof (value as ArrayLike<unknown>).length === 'number';

export function addFiles(value: unknown, picked: unknown, max = Number.POSITIVE_INFINITY): unknown[] {
  const items = fileItems(value);
  const added = fileItems(isListLike(picked) ? Array.from(picked) : picked);
  return [...items, ...added.slice(0, Math.max(0, max - items.length))];
}

export const removeFile = (value: unknown, index: number): unknown[] => fileItems(value).filter((_, at) => at !== index);

const fileName = (item: unknown): string | undefined =>
  typeof item === 'object' && item !== null && typeof (item as { name?: unknown }).name === 'string'
    ? (item as { name: string }).name
    : undefined;

export const isFileItem = (item: unknown): boolean => typeof item === 'string' || fileName(item) !== undefined;

function referenceName(item: unknown): string | undefined {
  if (typeof item !== 'string') return undefined;
  const path = item.replace(/[?#].*$/s, '').replace(/\/+$/, '');
  return path.slice(path.lastIndexOf('/') + 1) || item;
}

export interface FileEntry {
  index: number;
  name: string;
}

export const fileEntries = (value: unknown): FileEntry[] =>
  fileItems(value).flatMap((item, index) => {
    const name = fileName(item) ?? referenceName(item);
    return name === undefined ? [] : [{ index, name }];
  });

export const filesFull = (field: FormField, value: unknown): boolean => fileItems(value).length >= fileLimit(field);

export interface FileText {
  label: (key: LabelKey, params?: Record<string, unknown>) => string;
  limit: (field: FormField, max: number) => string;
}

export const defaultFileText: FileText = {
  label: (key, params = {}) => labelFor(key, params),
  limit: (field, max) => field.validation?.maxLengthMessage ?? getDefaultMessage('maxItems', { max }),
};

export interface FilePick {
  value: unknown[] | undefined;
  status: string;
  notice: string;
  full: boolean;
  focus: number | null;
}

export function pickFiles(field: FormField, value: unknown, picked: unknown, text: FileText = defaultFileText): FilePick {
  const max = fileLimit(field);
  const offered = fileItems(isListLike(picked) ? Array.from(picked) : picked);
  const before = fileItems(value).length;
  const next = addFiles(value, offered, max);
  const added = next.slice(before);
  const names = added.flatMap((item) => fileName(item) ?? []).join(', ');
  const notice = added.length < offered.length ? text.limit(field, max) : '';
  const status = [added.length ? text.label('itemAdded', { item: names }) : '', notice].filter(Boolean).join(' ');
  const full = next.length >= max;
  return { value: added.length ? next : undefined, status, notice, full, focus: full ? fileEntries(next).length - 1 : null };
}
