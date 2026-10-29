import { fieldState, fieldValue, freeText, optionChecked, type FieldAria, type FieldControl, type FieldView } from '@formhaus/core/fields';
import { computed, ref } from 'vue';
import type { FieldComponentProps } from '../types';

export type FieldEmit = ((event: 'update:modelValue', value: unknown) => void) &
  ((event: 'commit', value: unknown) => void) &
  ((event: 'blur') => void) &
  ((event: 'focus') => void);

export interface FieldAttrs extends FieldControl {
  autocomplete?: string;
}

export interface FieldProps extends FieldView<FieldAttrs> {
  onInput: (event: Event) => void;
  input: FieldAttrs &
    Omit<FieldAria, 'aria-describedby'> & {
      modelValue: unknown;
      'onUpdate:modelValue': (value: unknown) => void;
    };
}

export function useFieldProps(props: FieldComponentProps, emit: FieldEmit): Readonly<FieldProps> {
  const change = (value: unknown) => emit('update:modelValue', fieldValue(props.field, value));
  const commit = (value: unknown) => (props.field.autoAdvance ? emit('commit', value) : change(value));
  const blur = () => emit('blur');
  const focus = () => emit('focus');
  const onInput = (event: Event) => change((event.target as HTMLInputElement).value);
  const typed = ref('');
  const keep = (value: string, text: string) => {
    typed.value = text;
    change(value);
  };
  const view = computed((): FieldProps => {
    const state = fieldState(props);
    const control: FieldAttrs = {
      id: state.id,
      name: state.name,
      disabled: state.disabled,
      placeholder: state.placeholder,
      inputMode: state.inputMode,
      autocomplete: props.field.autocomplete,
      onBlur: blur,
      onFocus: focus,
    };
    const options = props.matrix?.columns ?? props.field.options ?? [];
    return {
      ...state,
      value: props.modelValue,
      text: props.modelValue == null ? '' : String(props.modelValue),
      loading: !!props.loading,
      freeText: freeText(options, props.modelValue, typed.value, keep),
      testId: props.testId,
      options,
      change,
      commit,
      blur,
      focus,
      onInput,
      attrs: { ...control, ...state.aria, 'data-testid': props.testId },
      input: {
        ...control,
        'aria-invalid': state.aria['aria-invalid'],
        'aria-required': state.aria['aria-required'],
        modelValue: props.modelValue,
        'onUpdate:modelValue': change,
      },
      option: (option, index) => ({
        id: state.optionId(index),
        name: state.name,
        value: option.value,
        checked: optionChecked(props.modelValue, option),
        disabled: state.disabled,
        'data-testid': props.optionTestId?.(option.value),
        onBlur: blur,
        onFocus: focus,
      }),
    };
  });
  return new Proxy({} as FieldProps, { get: (_, key) => view.value[key as keyof FieldProps] });
}
