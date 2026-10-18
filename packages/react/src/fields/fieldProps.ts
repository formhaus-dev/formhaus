import { fieldDomId } from '@formhaus/core/internal';
import type { FormField } from '@formhaus/core';
import type { KeyboardEvent, MouseEvent } from 'react';
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

export function choiceHandlers(
  { field, onChange, onCommit }: FieldComponentProps,
  arrow: { current: boolean },
  pick?: (key: string) => unknown,
) {
  const commit = field.autoAdvance && onCommit;
  return (value: unknown) => ({
    onChange: () => {
      if (!commit || arrow.current) onChange(value);
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      arrow.current = event.key.startsWith('Arrow');
      const picked = pick?.(event.key);
      if (picked !== undefined) {
        event.preventDefault();
        (commit || onChange)(picked);
        event.currentTarget.parentElement?.parentElement?.querySelector<HTMLInputElement>(`[value="${picked}"]`)?.focus();
      }
      if (commit && event.key === ' ') event.preventDefault();
      if (commit && event.key === 'Enter') {
        event.preventDefault();
        if (!event.repeat) commit(value);
      }
    },
    onKeyUp: (event: KeyboardEvent<HTMLInputElement>) => {
      arrow.current = false;
      if (commit && event.key === ' ') {
        event.preventDefault();
        commit(value);
      }
    },
    onPointerDown: () => {
      arrow.current = false;
    },
    onClick: (event: MouseEvent<HTMLInputElement>) => {
      if (!commit || arrow.current) return;
      if (event.detail > 1) event.preventDefault();
      else commit(value);
    },
  });
}
