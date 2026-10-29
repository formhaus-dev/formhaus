import { isFileList } from '../validation/type-checks';

export { isFileList };

export const fileItems = (value: unknown): unknown[] => (Array.isArray(value) ? value : value == null || value === '' ? [] : [value]);

export const isListLike = (value: unknown): value is ArrayLike<unknown> =>
  typeof value === 'object' && value !== null && typeof (value as ArrayLike<unknown>).length === 'number';

export const addFiles = (value: unknown, picked: unknown): unknown[] => [
  ...fileItems(value),
  ...(isListLike(picked) ? Array.from(picked) : fileItems(picked)),
];

export const removeFile = (value: unknown, index: number): unknown[] => fileItems(value).filter((_, at) => at !== index);

export const fileName = (item: unknown): string | undefined =>
  typeof item === 'object' && item !== null && typeof (item as { name?: unknown }).name === 'string'
    ? (item as { name: string }).name
    : undefined;

export interface FileEntry {
  index: number;
  name: string;
}

export const fileEntries = (value: unknown): FileEntry[] =>
  fileItems(value).flatMap((item, index) => {
    const name = fileName(item);
    return name === undefined ? [] : [{ index, name }];
  });

interface Focusable {
  focus(): void;
}

interface ButtonList {
  querySelectorAll(selector: 'button'): ArrayLike<Focusable>;
}

export const nextRemove = (list: ButtonList | null | undefined, position: number): Focusable | undefined => {
  const buttons = list?.querySelectorAll('button');
  return buttons?.[position] ?? buttons?.[position - 1];
};

export const fileNames = (items: unknown[]): string => items.flatMap((item) => fileName(item) ?? []).join(', ');
