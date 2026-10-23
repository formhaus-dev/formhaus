import type { FormField } from '@formhaus/core';
import type { FieldComponentProps } from '@formhaus/react';

export function inputProps({ id, field, error, loading, disabled, onBlur, onFocus }: FieldComponentProps) {
  return {
    id,
    name: field.key,
    label: field.label,
    description: field.helperText,
    error,
    placeholder: field.placeholder,
    disabled: disabled || loading,
    withAsterisk: !!field.validation?.required,
    onBlur,
    onFocus,
  };
}

export function scalePoints(field: FormField) {
  const min = field.type === 'rating' ? 1 : (field.validation?.min ?? 1);
  const max = field.validation?.max ?? 5;
  return Array.from({ length: Math.min(11, Math.max(0, max - min + 1)) }, (_, index) => min + index);
}

export const pick = ({ field, onChange, onCommit }: FieldComponentProps) => (field.autoAdvance && onCommit) || onChange;
