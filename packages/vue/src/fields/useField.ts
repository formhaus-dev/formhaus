import { fieldDomId } from '@formhaus/core/internal';
import type { FormField } from '@formhaus/core';
import { computed } from 'vue';
import type { FieldEmits, FormFieldProps } from '../types';

export function fieldIds(field: Pick<FormField, 'key'>, id?: string) {
  const inputId = id ?? fieldDomId(undefined, field.key);
  return { inputId, helperId: `${inputId}-helper`, errorId: `${inputId}-error` };
}

export function fieldAria(field: Pick<FormField, 'key' | 'helperText'>, id: string | undefined, error?: string) {
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

export function useChoice(
  props: FormFieldProps,
  emit: ((event: 'update:modelValue', value: unknown) => void) & ((event: 'commit', value: unknown) => void),
  pick?: (key: string) => unknown,
) {
  let arrow = false;
  return (value: unknown) => {
    const commit = (input: unknown) => (props.field.autoAdvance ? emit('commit', input) : emit('update:modelValue', input));
    return {
      onKeydown(event: KeyboardEvent) {
        arrow = event.key.startsWith('Arrow');
        const picked = event.metaKey || event.ctrlKey || event.altKey || event.isComposing ? undefined : pick?.(event.key);
        if (picked !== undefined) {
          event.preventDefault();
          if (event.repeat) return;
          commit(picked);
          (event.currentTarget as HTMLElement).parentElement?.parentElement
            ?.querySelector<HTMLInputElement>(`[value="${picked}"]`)
            ?.focus();
        }
        if (props.field.autoAdvance && event.key === ' ') event.preventDefault();
        if (props.field.autoAdvance && event.key === 'Enter') {
          event.preventDefault();
          if (!event.repeat) commit(value);
        }
      },
      onKeyup(event: KeyboardEvent) {
        arrow = false;
        if (props.field.autoAdvance && event.key === ' ') {
          event.preventDefault();
          commit(value);
        }
      },
      onPointerdown() {
        arrow = false;
      },
      onClick(event: MouseEvent) {
        if (!props.field.autoAdvance || arrow) return;
        if (event.detail > 1) event.preventDefault();
        else commit(value);
      },
      onChange() {
        if (!props.field.autoAdvance || arrow) emit('update:modelValue', value);
      },
    };
  };
}
