import type { FormField } from '@formhaus/core';

export const describedBy = (id: string, field: FormField, error?: string) =>
  [field.helperText && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

export const optionId = (id: string, index: number) => (index === 0 ? id : `${id}-${index}`);

export function scalePoints(field: FormField) {
  const min = field.type === 'rating' ? 1 : (field.validation?.min ?? 1);
  const max = field.validation?.max ?? 5;
  const points = Array.from({ length: Math.max(0, Math.min(11, max - min + 1)) }, (_, index) => min + index);
  const anchor = (point: number) => field.options?.find((option) => option.value === String(point))?.label;
  return { points, start: anchor(min), middle: anchor(Math.floor((min + max) / 2)), end: anchor(max) };
}

export function pick(field: FormField, value: unknown, onChange: (value: unknown) => void, onCommit?: (value: unknown) => void) {
  if (field.autoAdvance && onCommit) onCommit(value);
  else onChange(value);
}
