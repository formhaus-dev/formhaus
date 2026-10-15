import { fieldDomId } from '@formhaus/core/internal';
import type { FormField } from '@formhaus/core';
import type { FieldComponentProps } from '../types';

export function fieldId(props: Pick<FieldComponentProps, 'id' | 'field'>): string {
  return props.id ?? fieldDomId(undefined, props.field.key);
}

export function describedBy(field: Pick<FormField, 'helperText'>, id: string, error?: string) {
  return [field.helperText && `${id}-helper`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
}

export function optionProps({ disabled, loading, onBlur, onFocus }: FieldComponentProps) {
  return { disabled: disabled || loading, onBlur, onFocus };
}

export function inputProps(props: FieldComponentProps) {
  const id = fieldId(props);
  return {
    id,
    name: props.field.key,
    ...optionProps(props),
    'aria-invalid': !!props.error,
    'aria-required': !!props.field.validation?.required || undefined,
    'aria-describedby': describedBy(props.field, id, props.error),
  };
}
