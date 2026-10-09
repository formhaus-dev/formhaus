import type { FormField } from '@formhaus/core';
import { computed } from 'vue';
import type { FieldEmits, FormFieldProps } from '../types';

export function fieldIds(field: FormField) {
  const inputId = `fh-field-${field.key}`;
  return { inputId, helperId: `${inputId}-helper` };
}

export function fieldAria(field: FormField, error?: string) {
  return {
    'aria-invalid': !!error || undefined,
    'aria-describedby': error || field.helperText ? fieldIds(field).helperId : undefined,
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
  }));
  return { inputId, control, input };
}
