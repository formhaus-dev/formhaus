import type { FormAction, FormField, FormGroup, FormSection } from '@formhaus/core';
import type { Component, PropType } from 'vue';
import type { FormStepStatus, GroupItemComponentProps, HeadingLevel } from './types';

const required = <T>(type: PropType<T>) => ({ type, required: true as const });
const any = <T>() => null as unknown as PropType<T>;
const callback = <T extends (...args: never[]) => unknown>() => required(Function as PropType<T>);

export const formFieldProps = {
  id: String,
  field: required(Object as PropType<FormField>),
  modelValue: required(any<unknown>()),
  error: String,
  loading: Boolean,
  disabled: Boolean,
};

export const formFieldEmits = {
  'update:modelValue': (_value: unknown) => true,
  commit: (_value: unknown) => true,
  blur: () => true,
  focus: () => true,
};

export const sectionComponentProps = {
  id: required(String),
  section: required(Object as PropType<FormSection>),
  title: required(String),
  description: String,
  descriptionId: String,
};

export const groupItemComponentProps = {
  id: required(String),
  index: required(Number),
  title: required(String),
  titleId: required(String),
  canRemove: required(Boolean),
  remove: callback<() => void>(),
  requestRemove: callback<() => void>(),
  hasContent: required(Boolean),
  removeLabel: required(String),
  removeName: required(String),
  disabled: Boolean,
  fields: required(any<Component>()),
};

export const groupComponentProps = {
  id: required(String),
  group: required(Object as PropType<FormGroup>),
  label: required(String),
  helperText: String,
  error: String,
  describedBy: String,
  items: required(Array as PropType<GroupItemComponentProps[]>),
  canAdd: required(Boolean),
  add: callback<() => void>(),
  remove: callback<(id: string) => void>(),
  requestRemove: callback<(id: string) => void>(),
  addLabel: required(String),
  removeLabel: required(String),
  disabled: Boolean,
  status: required(String),
  itemComponent: required(any<Component>()),
};

export const confirmDialogComponentProps = {
  id: required(String),
  open: required(Boolean),
  title: required(String),
  description: required(String),
  confirmLabel: required(String),
  cancelLabel: required(String),
  confirm: callback<() => void>(),
  cancel: callback<() => void>(),
};

const optionalBoolean = { type: Boolean, default: undefined };
const action = Object as PropType<FormAction>;
const stepAction = [Object, Boolean] as PropType<FormAction | false>;

export const formActionsProps = {
  submitAction: action,
  nextAction: stepAction,
  backAction: stepAction,
  cancelAction: action,
  skipAction: action,
  isFirstStep: required(Boolean),
  isLastStep: required(Boolean),
  isMultiStep: required(Boolean),
  loading: Boolean,
  values: Object as PropType<Record<string, unknown>>,
  primaryLabel: String,
  showPrimary: optionalBoolean,
  showBack: optionalBoolean,
  backLabel: String,
  showSkip: optionalBoolean,
  skipLabel: String,
};

export const formActionsEmits = {
  submit: () => true,
  next: () => true,
  prev: () => true,
  cancel: () => true,
  skip: () => true,
  primary: () => true,
};

export const formStepProgressProps = {
  current: required(Number),
  total: required(Number),
  stepTitle: String,
  stepDescription: String,
  headingLevel: { type: Number as PropType<HeadingLevel>, default: 2 },
  steps: Array as PropType<FormStepStatus[]>,
  counterLabel: String,
  stepErrorCount: Number,
};
