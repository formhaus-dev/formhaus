import { fileLimit, isFileList } from '../validation/type-checks';

export { fileLimit, isFileList };

export const fileItems = (value: unknown): unknown[] => (Array.isArray(value) ? value : value == null || value === '' ? [] : [value]);

export const isListLike = (value: unknown): value is ArrayLike<unknown> =>
  typeof value === 'object' && value !== null && typeof (value as ArrayLike<unknown>).length === 'number';

export function addFiles(value: unknown, picked: unknown, max = Number.POSITIVE_INFINITY): unknown[] {
  const items = fileItems(value);
  const added = isListLike(picked) ? Array.from(picked) : fileItems(picked);
  return [...items, ...added.slice(0, Math.max(0, max - items.length))];
}

export const removeFile = (value: unknown, index: number): unknown[] => fileItems(value).filter((_, at) => at !== index);

export const fileName = (item: unknown): string | undefined =>
  typeof item === 'object' && item !== null && typeof (item as { name?: unknown }).name === 'string'
    ? (item as { name: string }).name
    : undefined;

function referenceName(item: unknown): string | undefined {
  if (typeof item !== 'string' || item === '') return undefined;
  const trimmed = item.replace(/\/+$/, '');
  return trimmed.slice(trimmed.lastIndexOf('/') + 1) || item;
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
