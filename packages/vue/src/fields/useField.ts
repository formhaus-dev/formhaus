import { fieldDomId } from '@formhaus/core/internal';
import type { FormField } from '@formhaus/core';
import { computed } from 'vue';
import type { FieldEmits, FormFieldProps } from '../types';

export function fieldIds(field: FormField, id?: string) {
  const inputId = id ?? fieldDomId(undefined, field.key);
  return { inputId, helperId: `${inputId}-helper`, errorId: `${inputId}-error` };
}

export function fieldAria(field: FormField, id: string | undefined, error?: string) {
  const { helperId, errorId } = fieldIds(field, id);
  const ids = [field.helperText && helperId, error && errorId].filter(Boolean);
  return {
    'aria-invalid': !!error || undefined,
    'aria-describedby': ids.length ? ids.join(' ') : undefined,
  };
}

export function useField(props: FormFieldProps, emit: FieldEmits) {
  const inputId = computed(() => fieldIds(props.field, props.id).inputId);
  const control = computed(() => ({
    disabled: props.disabled || props.loading,
    onFocus: () => emit('focus'),
    onBlur: () => emit('blur'),
  }));
  const input = computed(() => ({
    id: inputId.value,
    name: props.field.key,
    ...control.value,
    ...fieldAria(props.field, props.id, props.error),
    'aria-required': !!props.field.validation?.required || undefined,
  }));
  return { inputId, control, input };
}
