import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import { addFiles, fileEntries, fileItems, fileName } from '../fields/files';
import type { FormField, LabelKey } from '../types';
import { getDefaultMessage } from '../validation/default-messages';
import { maxItems } from '../validation/type-checks';

export type FileLimitMessage = (field: FormField, max: number) => string;

type Label = (key: LabelKey, params?: Record<string, unknown>) => string;

export const defaultFileLimit: FileLimitMessage = (field, max) =>
  field.validation?.maxLengthMessage ?? getDefaultMessage('maxItems', { max });

export const engineFileLimit =
  (engine: FormEngine): FileLimitMessage =>
  (field, max) =>
    field.validation?.maxLengthMessage ?? (engine as unknown as EngineInternals).messages('maxItems', { max }, field);

export const filesFull = (field: FormField, value: unknown): boolean => fileItems(value).length >= maxItems(field);

export function pickFiles(field: FormField, value: unknown, picked: unknown[], label: Label, limit: FileLimitMessage) {
  const max = maxItems(field);
  const before = fileItems(value).length;
  const next = addFiles(value, picked, max);
  const added = next.slice(before);
  const names = added.flatMap((item) => fileName(item) ?? []).join(', ');
  const notice = added.length < picked.length ? limit(field, max) : '';
  const status = [added.length ? label('itemAdded', { item: names }) : '', notice].filter(Boolean).join(' ');
  const full = next.length >= max;
  return { value: added.length ? next : undefined, status, notice, focus: full ? fileEntries(next).length - 1 : null };
}

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
