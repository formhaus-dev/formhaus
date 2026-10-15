import { isGroup, type FormField, type FormSection } from '@formhaus/core';
import { fieldDomId, type OptionSource, optionSources, providedOptions } from '@formhaus/core/internal';
import { computed, shallowRef, watch, type Ref } from 'vue';
import { useFieldOptions } from './useFieldOptions';
import type { FormRendererProps } from '../types';
import type { UseFormEngineReturn } from './useFormEngine';

interface Handlers {
  update: (key: string, value: unknown) => void;
  commit: (key: string, value: unknown) => void;
  blur: (key: string) => void;
  focus: (key: string) => void;
}

export function useNodeProps(form: UseFormEngineReturn, props: FormRendererProps, formId: string, disabled: Ref<boolean>, on: Handlers) {
  const { values, errors, fieldLoading, visibleFields } = form;
  const sources = shallowRef<OptionSource[]>([]);
  watch(
    visibleFields,
    (fields) => {
      sources.value = optionSources(fields);
    },
    { immediate: true },
  );
  const loaded = useFieldOptions(
    sources,
    () => form.engine,
    () => props.optionsProviders,
  );
  const options = computed(() => providedOptions(sources.value, props.optionsProviders, loaded.value));
  return {
    sectionProps(section: FormSection) {
      const id = fieldDomId(formId, section.key, form.engine.definition);
      return {
        id,
        section,
        title: section.title,
        description: section.description,
        descriptionId: section.description ? `${id}-description` : undefined,
      };
    },
    nodeProps(field: FormField) {
      if (isGroup(field)) {
        return {
          engine: form.engine,
          formId,
          group: field,
          items: form.engine.items(field.key),
          value: values.value[field.key],
          errors: { ...errors.value },
          fieldLoading: { ...fieldLoading.value },
          disabled: disabled.value,
          components: props.components,
          labels: props.labels,
          confirmRemove: props.confirmRemove,
          options: options.value,
          onUpdate: on.update,
          onBlur: on.blur,
          onFocus: on.focus,
        };
      }
      const resolved = options.value[field.key];
      return {
        id: fieldDomId(formId, field.key, form.engine.definition),
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
  };
}
