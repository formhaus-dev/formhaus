import type { FormField } from '@formhaus/core';
import type { FieldComponentProps } from '../types';

export function describedBy(field: FormField, error?: string) {
  return error ? `${field.key}-error` : field.helperText ? `${field.key}-helper` : undefined;
}

export function optionProps({ disabled, loading, onBlur, onFocus }: FieldComponentProps) {
  return { disabled: disabled || loading, onBlur, onFocus };
}

export function inputProps(props: FieldComponentProps) {
  return {
    id: props.field.key,
    ...optionProps(props),
    'aria-invalid': !!props.error,
    'aria-describedby': describedBy(props.field, props.error),
  };
}
