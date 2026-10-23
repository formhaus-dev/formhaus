import { DECIMAL } from '../validation/type-checks';
import type { FormField } from '../types';

export function numberValue(text: string | null | undefined): number | string | null {
  const trimmed = text?.trim() ?? '';
  return trimmed === '' ? null : DECIMAL.test(trimmed) ? Number(trimmed) : trimmed;
}

export function fieldValue(field: Pick<FormField, 'type'>, value: unknown): unknown {
  return field.type === 'number' && typeof value === 'string' ? numberValue(value) : value;
}

export function toggleOption(value: unknown, option: string): string[] {
  const selected: string[] = Array.isArray(value) ? value : [];
  return selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
}

const INPUT_TYPES: Record<string, string> = {
  email: 'email',
  phone: 'tel',
  number: 'number',
  password: 'password',
  date: 'date',
  time: 'time',
  datetime: 'datetime-local',
};

export const inputType = (field: Pick<FormField, 'type'>): string => INPUT_TYPES[field.type] ?? 'text';
