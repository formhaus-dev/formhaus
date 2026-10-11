import type { FormField } from '@formhaus/core';
import type { FieldComponentProps } from '../types';

export function describedBy(field: FormField, error?: string) {
  return [field.helperText && `${field.key}-helper`, error && `${field.key}-error`].filter(Boolean).join(' ') || undefined;
}

export function optionProps({ disabled, loading, onBlur, onFocus }: FieldComponentProps) {
  return { disabled: disabled || loading, onBlur, onFocus };
}

export function inputProps(props: FieldComponentProps) {
  return {
    id: props.field.key,
    ...optionProps(props),
    'aria-invalid': !!props.error,
    'aria-required': !!props.field.validation?.required || undefined,
    'aria-describedby': describedBy(props.field, props.error),
  };
}
