import { fieldAria, fieldId, optionAttrs, readOnlyAttrs } from '@formhaus/core/fields';
import type { FieldOption, FormField, FormGroup } from '@formhaus/core';
import { keepReadOnly } from '@formhaus/core/internal';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { FieldComponentProps } from '../types';

export { fieldId };

export function describedBy(field: FormField | FormGroup, id: string, error?: string) {
  return fieldAria({ id, field, error })['aria-describedby'];
}

export function optionProps(props: FieldComponentProps, value?: unknown) {
  const { disabled, loading, onBlur, onFocus, optionTestId } = props;
  return { disabled: disabled || loading, onBlur, onFocus, 'data-testid': optionTestId?.(String(value)), ...readOnlyAttrs(props) };
}

const keep = (props: FieldComponentProps) =>
  readOnlyAttrs(props)['aria-readonly'] && { onKeyDown: keepReadOnly, onClick: props.field.type === 'file' ? keepReadOnly : undefined };

export function inputProps(props: FieldComponentProps) {
  const id = fieldId(props);
  return {
    id,
    name: props.field.key,
    autoComplete: props.field.autocomplete,
    ...optionProps(props),
    ...fieldAria(props),
    ...keep(props),
    'aria-invalid': !!props.error,
    'data-testid': props.testId,
  };
}

export function choiceProps(props: FieldComponentProps, option: FieldOption, id: string) {
  const base = optionProps(props, option.value);
  return { ...base, ...optionAttrs(option, id, base.disabled), ...keep(props), id };
}

const noop = () => {};

export function choiceHandlers(props: FieldComponentProps, arrow: { current: boolean }, pick?: (key: string) => unknown) {
  const { field, onChange, onCommit, readOnly } = props;
  const commit = field.autoAdvance && onCommit;
  if (readOnly) return () => ({ ...keep(props), onChange: noop });
  return (value: unknown) => ({
    onChange: () => {
      if (!commit || arrow.current) onChange(value);
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      arrow.current = event.key.startsWith('Arrow');
      const picked = event.metaKey || event.ctrlKey || event.altKey || event.nativeEvent.isComposing ? undefined : pick?.(event.key);
      if (picked !== undefined) {
        event.preventDefault();
        if (event.repeat) return;
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
