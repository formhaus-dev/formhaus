import { fieldState, fieldValue, freeText, optionChecked, type FieldAria, type FieldControl, type FieldView } from '@formhaus/core/fields';
import { type ChangeEvent, useState } from 'react';
import { optionProps } from './fields/fieldProps';
import type { FieldComponentProps } from './types';

export interface FieldAttrs extends FieldControl {
  autoComplete?: string;
}

type InputEvent = ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

export interface FieldProps extends FieldView<FieldAttrs> {
  onInput: (event: InputEvent) => void;
  input: FieldAttrs &
    Omit<FieldAria, 'aria-describedby'> & {
      value: string;
      onChange: (event: InputEvent) => void;
    };
}

const noop = () => {};

function fieldView(props: FieldComponentProps, [typed, setTyped]: [string, (text: string) => void]): FieldProps {
  const state = fieldState(props);
  const { field, value, onCommit, onBlur, onFocus = noop } = props;
  const text = value == null ? '' : String(value);
  const options = props.matrix?.columns ?? field.options ?? [];
  const change = (next: unknown) => props.onChange(fieldValue(field, next));
  const onInput = ({ target }: InputEvent) => change(target.value);
  const control: FieldAttrs = {
    id: state.id,
    name: state.name,
    disabled: state.disabled,
    placeholder: state.placeholder,
    inputMode: state.inputMode,
    autoComplete: field.autocomplete,
    onBlur,
    onFocus,
  };
  return {
    ...state,
    value,
    text,
    loading: !!props.loading,
    freeText: freeText(options, value, typed, (next, typedText) => {
      setTyped(typedText);
      change(next);
    }),
    testId: props.testId,
    options,
    change,
    commit: field.autoAdvance && onCommit ? onCommit : change,
    blur: onBlur,
    focus: onFocus,
    onInput,
    attrs: { ...control, ...state.aria, 'data-testid': props.testId },
    input: {
      ...control,
      'aria-invalid': state.aria['aria-invalid'],
      'aria-required': state.aria['aria-required'],
      value: text,
      onChange: onInput,
    },
    option: (option, index) => ({
      ...optionProps(props, option.value),
      onFocus,
      id: state.optionId(index),
      name: state.name,
      value: option.value,
      checked: optionChecked(value, option),
      disabled: state.disabled,
    }),
  };
}

export function fieldProps(props: FieldComponentProps): FieldProps {
  return fieldView(props, ['', noop]);
}

export function useFieldProps(props: FieldComponentProps): FieldProps {
  return fieldView(props, useState(''));
}
