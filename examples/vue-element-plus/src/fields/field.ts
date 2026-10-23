import type { FormField } from '@formhaus/core';

export const describedBy = (id: string, field: FormField, error?: string) =>
  [field.helperText && `${id}-helper`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

export function scalePoints(field: FormField) {
  const min = field.type === 'rating' ? 1 : (field.validation?.min ?? 1);
  const max = field.validation?.max ?? 5;
  const points = Array.from({ length: Math.max(0, Math.min(11, max - min + 1)) }, (_, index) => min + index);
  const anchor = (point: number) => field.options?.find((option) => option.value === String(point))?.label;
  return { points, start: anchor(min), middle: anchor(Math.floor((min + max) / 2)), end: anchor(max) };
}

const pad = (part: number) => String(part).padStart(2, '0');

export function toDate(value: unknown, type: string): Date | null {
  if (typeof value !== 'string') return null;
  const time = /^(\d{2}):(\d{2})$/.exec(value);
  if (type === 'time' && time) return new Date(2000, 0, 1, Number(time[1]), Number(time[2]));
  const date = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(value);
  if (!date) return null;
  return new Date(Number(date[1]), Number(date[2]) - 1, Number(date[3]), Number(date[4] ?? 0), Number(date[5] ?? 0));
}

export function fromDate(date: unknown, type: string): string {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return type === 'date' ? day : type === 'time' ? time : `${day}T${time}`;
}
