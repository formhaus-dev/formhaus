import type { FieldOption, FormEngine, FormField, FormGroup, GroupItem, RevealView } from '@formhaus/core';
import type { TestId } from '@formhaus/core/internal';
import type { PropType, VNode } from 'vue';
import { any, callback, fieldComponentProps, labelSource, required } from './props';
import type { FieldComponentMap, LayoutComponentMap } from './types';

const extend = <Base, Extra>(base: Base, extra: Extra) => ({ ...base, ...extra });

export const formhausFieldProps = /* @__PURE__ */ extend(fieldComponentProps, { components: Object as PropType<FieldComponentMap> });
export const fieldResolverProps = /* @__PURE__ */ extend(formhausFieldProps, { busy: Boolean });

export const formGroupProps = {
  engine: /* @__PURE__ */ required(Object as PropType<FormEngine>),
  formId: /* @__PURE__ */ required(String),
  group: /* @__PURE__ */ required(Object as PropType<FormGroup>),
  items: /* @__PURE__ */ required(Array as PropType<GroupItem[]>),
  value: /* @__PURE__ */ required(/* @__PURE__ */ any<unknown>()),
  errors: /* @__PURE__ */ required(Object as PropType<Readonly<Record<string, string>>>),
  fieldLoading: /* @__PURE__ */ required(Object as PropType<Readonly<Record<string, boolean>>>),
  disabled: Boolean,
  components: Object as PropType<FieldComponentMap>,
  layout: Object as PropType<LayoutComponentMap>,
  labels: labelSource,
  options: /* @__PURE__ */ required(Object as PropType<Record<string, FieldOption[]>>),
  busy: /* @__PURE__ */ required(Object as PropType<Record<string, boolean>>),
  confirmRemove: { type: Boolean, default: true },
  onItemsChange: /* @__PURE__ */ callback<(key: string, apply: () => boolean) => boolean>(),
  recall: /* @__PURE__ */ any<unknown>(),
  testId: Function as PropType<TestId>,
};

export const fieldShellProps = {
  id: String,
  field: /* @__PURE__ */ required(Object as PropType<FormField>),
  error: String,
  variant: String as PropType<'checkbox' | 'switch' | 'radio' | 'multiselect' | 'scale' | 'rating'>,
  testId: String,
  errorFirst: Boolean,
};

export const optionImageProps = {
  option: /* @__PURE__ */ required(Object as PropType<FieldOption>),
};

export const revealSlotProps = {
  reveal: Object as PropType<RevealView<VNode>>,
};
