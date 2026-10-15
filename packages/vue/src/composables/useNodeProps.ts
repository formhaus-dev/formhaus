import type { FieldOption, FormField, FormGroup } from '@formhaus/core';
import { fieldDomId } from '@formhaus/core/internal';
import type { Ref } from 'vue';
import type { FormRendererProps } from '../types';
import type { UseFormEngineReturn } from './useFormEngine';

interface Handlers {
  update: (key: string, value: unknown) => void;
  commit: (key: string, value: unknown) => void;
  blur: (key: string) => void;
  focus: (key: string) => void;
}

export function useNodeProps(
  form: UseFormEngineReturn,
  props: FormRendererProps,
  formId: string,
  options: Ref<Record<string, FieldOption[]>>,
  disabled: Ref<boolean>,
  on: Handlers,
) {
  const { values, errors, fieldLoading } = form;
  return {
    fieldProps(field: FormField) {
      const resolved = options.value[field.key];
      return {
        id: fieldDomId(formId, field.key),
        field: resolved ? { ...field, options: resolved } : field,
        modelValue: values.value[field.key],
        error: errors.value[field.key],
        loading: fieldLoading.value[field.key],
        disabled: disabled.value,
        components: props.components,
        'onUpdate:modelValue': (value: unknown) => on.update(field.key, value),
        onCommit: (value: unknown) => on.commit(field.key, value),
        onBlur: () => on.blur(field.key),
        onFocus: () => on.focus(field.key),
      };
    },
    groupProps(field: FormField | FormGroup) {
      return {
        engine: form.engine,
        formId,
        group: field as FormGroup,
        items: form.engine.items(field.key),
        value: values.value[field.key],
        errors: { ...errors.value },
        fieldLoading: { ...fieldLoading.value },
        disabled: disabled.value,
        components: props.components,
        labels: props.labels,
        options: options.value,
        onUpdate: on.update,
        onBlur: on.blur,
        onFocus: on.focus,
      };
    },
  };
}
