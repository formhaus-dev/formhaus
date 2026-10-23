import { isGroup, type FieldOption, type FormField, type FormSection, type GroupItem } from '@formhaus/core';
import {
  fieldDomId,
  fieldTestIds,
  type OptionSource,
  optionSources,
  providedOptions,
  recalled,
  recalls,
  shownOptions,
  type TestId,
} from '@formhaus/core/internal';
import { computed, shallowRef, watch, type Ref } from 'vue';
import { useFieldOptions } from './useFieldOptions';
import { useMounted } from './useMounted';
import type { FormRendererProps } from '../types';
import type { UseFormEngineReturn } from './useFormEngine';

interface Handlers {
  update: (key: string, value: unknown) => void;
  commit: (key: string, value: unknown) => void;
  changeItems: (key: string, apply: () => boolean) => boolean;
  blur: (key: string) => void;
  focus: (key: string) => void;
}

interface GroupMemo {
  items: GroupItem[];
  errors: Record<string, string>;
  loading: Record<string, boolean>;
}

const sameItems = (a: GroupItem[], b: GroupItem[]) =>
  a.length === b.length &&
  a.every(
    (item, index) =>
      item.id === b[index].id &&
      item.fields.length === b[index].fields.length &&
      item.fields.every((field, at) => field === b[index].fields[at]),
  );

function owned<T>(record: Readonly<Record<string, T>>, key: string, previous?: Record<string, T>): Record<string, T> {
  const next: Record<string, T> = {};
  for (const path of Object.keys(record)) if (path === key || path.startsWith(`${key}.`)) next[path] = record[path];
  const keys = Object.keys(next);
  const same = previous && keys.length === Object.keys(previous).length && keys.every((path) => previous[path] === next[path]);
  return same ? previous : next;
}

export function useNodeProps(
  form: UseFormEngineReturn,
  props: FormRendererProps,
  formId: string,
  disabled: Ref<boolean>,
  testId: Ref<TestId | undefined>,
  on: Handlers,
) {
  const { values, errors, fieldLoading, visibleFields } = form;
  const sources = shallowRef<OptionSource[]>([]);
  watch(
    visibleFields,
    (fields) => {
      sources.value = optionSources(fields);
    },
    { immediate: true },
  );
  const [loaded, busy] = useFieldOptions(
    sources,
    () => form.engine,
    () => props.optionsProviders,
  );
  const options = computed(() => providedOptions(sources.value, props.optionsProviders, loaded.value));
  const mounted = useMounted();
  const groups = new Map<string, GroupMemo>();
  const ids = new Map<string, ReturnType<typeof fieldTestIds>>();
  let idsOwner = testId.value;
  const idsOf = (key: string) => {
    if (idsOwner !== testId.value) ids.clear();
    idsOwner = testId.value;
    return ids.get(key) ?? ids.set(key, fieldTestIds(testId.value, key)).get(key)!;
  };
  let owner = form.engine;
  const groupState = (key: string): GroupMemo => {
    if (owner !== form.engine) groups.clear();
    owner = form.engine;
    const previous = groups.get(key);
    const items = form.engine.items(key);
    const next = {
      items: previous && sameItems(previous.items, items) ? previous.items : items,
      errors: owned(errors.value, key, previous?.errors),
      loading: owned(fieldLoading.value, key, previous?.loading),
    };
    groups.set(key, next);
    return next;
  };
  return {
    sectionProps(section: FormSection) {
      const id = fieldDomId(formId, section.key, form.engine.definition);
      const { title, description } = recalled(form.engine, section);
      return {
        id,
        section,
        title,
        description,
        descriptionId: description ? `${id}-description` : undefined,
      };
    },
    nodeProps(field: FormField, columns?: FieldOption[], row?: number) {
      if (isGroup(field)) {
        const state = groupState(field.key);
        return {
          engine: form.engine,
          formId,
          group: field,
          items: state.items,
          value: values.value[field.key],
          recall: [field, ...field.fields].some((node) => recalls(form.engine, node)) ? values.value : undefined,
          errors: state.errors,
          fieldLoading: state.loading,
          disabled: disabled.value,
          components: props.components,
          layout: props.layout,
          labels: props.labels,
          confirmRemove: props.confirmRemove,
          options: options.value,
          busy: busy.value,
          testId: testId.value,
          onItemsChange: on.changeItems,
          onUpdate: on.update,
          onBlur: on.blur,
          onFocus: on.focus,
        };
      }
      const resolved = shownOptions(form.engine, field.key, field, options.value[field.key], mounted.value);
      return {
        id: fieldDomId(formId, field.key, form.engine.definition),
        field: recalled(form.engine, resolved ? { ...field, options: resolved } : field),
        modelValue: values.value[field.key],
        error: errors.value[field.key],
        loading: fieldLoading.value[field.key],
        busy: busy.value[field.key],
        disabled: disabled.value,
        components: props.components,
        matrix: columns && { columns, row: row! },
        ...idsOf(field.key),
        'onUpdate:modelValue': (value: unknown) => on.update(field.key, value),
        onCommit: (value: unknown) => on.commit(field.key, value),
        onBlur: () => on.blur(field.key),
        onFocus: () => on.focus(field.key),
      };
    },
  };
}
