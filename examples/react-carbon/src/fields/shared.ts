import type { FormField } from '@formhaus/core';
import type { FieldComponentProps } from '@formhaus/react';

export function inputProps({ id, field, error, loading, disabled, onBlur, onFocus }: FieldComponentProps) {
  return {
    id: id ?? field.key,
    name: field.key,
    labelText: field.label,
    helperText: field.helperText,
    invalid: !!error,
    invalidText: error,
    disabled: disabled || loading,
    onBlur,
    onFocus,
  };
}

export function groupProps({ field, error }: FieldComponentProps) {
  return { legendText: field.label, invalid: !!error };
}

export function scalePoints(field: FormField) {
  const min = field.type === 'rating' ? 1 : (field.validation?.min ?? 1);
  const max = field.validation?.max ?? 5;
  return Array.from({ length: Math.min(11, Math.max(0, max - min + 1)) }, (_, index) => min + index);
}

export const pick = ({ field, onChange, onCommit }: FieldComponentProps) => (field.autoAdvance && onCommit) || onChange;

const pad = (n: number) => String(n).padStart(2, '0');

export const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
};
