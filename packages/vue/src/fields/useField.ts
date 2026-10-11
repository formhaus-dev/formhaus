import type { FormField } from '@formhaus/core';
import { computed } from 'vue';
import type { FieldEmits, FormFieldProps } from '../types';

export function fieldIds(field: FormField) {
  const inputId = `fh-field-${field.key}`;
  return { inputId, helperId: `${inputId}-helper`, errorId: `${inputId}-error` };
}

export function fieldAria(field: FormField, error?: string) {
  const { helperId, errorId } = fieldIds(field);
  const ids = [field.helperText && helperId, error && errorId].filter(Boolean);
  return {
    'aria-invalid': !!error || undefined,
    'aria-describedby': ids.length ? ids.join(' ') : undefined,
  };
}

export function useField(props: FormFieldProps, emit: FieldEmits) {
  const inputId = computed(() => fieldIds(props.field).inputId);
  const control = computed(() => ({
    disabled: props.disabled || props.loading,
    onFocus: () => emit('focus'),
    onBlur: () => emit('blur'),
  }));
  const input = computed(() => ({
    id: inputId.value,
    ...control.value,
    ...fieldAria(props.field, props.error),
    'aria-required': !!props.field.validation?.required || undefined,
  }));
  return { inputId, control, input };
}
