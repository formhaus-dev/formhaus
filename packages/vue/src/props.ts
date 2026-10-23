import type {
  ErrorSummaryGroup,
  FieldOption,
  FormAction,
  FormActionsView,
  FormField,
  FormGroup,
  FormSection,
  RootProps,
} from '@formhaus/core';
import type { Component, PropType } from 'vue';
import type { FieldComponentProps, FormStepStatus, GroupItemComponentProps, HeadingLevel } from './types';

const required = <T>(type: PropType<T>) => ({ type, required: true as const });
const any = <T>() => null as unknown as PropType<T>;
const callback = <T extends (...args: never[]) => unknown>() => required(Function as PropType<T>);
const rootProps = Object as PropType<RootProps>;

export const fieldComponentProps = {
  id: String,
  field: /* @__PURE__ */ required(Object as PropType<FormField>),
  modelValue: /* @__PURE__ */ required(/* @__PURE__ */ any<unknown>()),
  error: String,
  loading: Boolean,
  disabled: Boolean,
  testId: String,
  optionTestId: Function as PropType<(value: string) => string | undefined>,
  matrix: Object as PropType<FieldComponentProps['matrix']>,
};

export const fieldComponentEmits = {
  'update:modelValue': (_value: unknown) => true,
  commit: (_value: unknown) => true,
  blur: () => true,
  focus: () => true,
};

export const sectionComponentProps = {
  id: /* @__PURE__ */ required(String),
  section: /* @__PURE__ */ required(Object as PropType<FormSection>),
  title: /* @__PURE__ */ required(String),
  description: String,
  descriptionId: String,
  columns: Array as PropType<FieldOption[]>,
};

export const groupItemComponentProps = {
  id: /* @__PURE__ */ required(String),
  index: /* @__PURE__ */ required(Number),
  title: /* @__PURE__ */ required(String),
  titleId: /* @__PURE__ */ required(String),
  canRemove: /* @__PURE__ */ required(Boolean),
  remove: /* @__PURE__ */ callback<() => void>(),
  requestRemove: /* @__PURE__ */ callback<() => void>(),
  hasContent: /* @__PURE__ */ required(Boolean),
  removeLabel: /* @__PURE__ */ required(String),
  removeName: /* @__PURE__ */ required(String),
  disabled: Boolean,
  fields: /* @__PURE__ */ required(/* @__PURE__ */ any<Component>()),
};

export const groupComponentProps = {
  id: /* @__PURE__ */ required(String),
  group: /* @__PURE__ */ required(Object as PropType<FormGroup>),
  label: /* @__PURE__ */ required(String),
  helperText: String,
  error: String,
  describedBy: String,
  items: /* @__PURE__ */ required(Array as PropType<GroupItemComponentProps[]>),
  canAdd: /* @__PURE__ */ required(Boolean),
  add: /* @__PURE__ */ callback<() => void>(),
  remove: /* @__PURE__ */ callback<(id: string) => void>(),
  requestRemove: /* @__PURE__ */ callback<(id: string) => void>(),
  addLabel: /* @__PURE__ */ required(String),
  removeLabel: /* @__PURE__ */ required(String),
  disabled: Boolean,
  status: /* @__PURE__ */ required(String),
  itemComponent: /* @__PURE__ */ required(/* @__PURE__ */ any<Component>()),
};

export const confirmDialogComponentProps = {
  id: /* @__PURE__ */ required(String),
  open: /* @__PURE__ */ required(Boolean),
  title: /* @__PURE__ */ required(String),
  description: /* @__PURE__ */ required(String),
  confirmLabel: /* @__PURE__ */ required(String),
  cancelLabel: /* @__PURE__ */ required(String),
  confirm: /* @__PURE__ */ callback<() => void>(),
  cancel: /* @__PURE__ */ callback<() => void>(),
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
  isFirstStep: /* @__PURE__ */ required(Boolean),
  isLastStep: /* @__PURE__ */ required(Boolean),
  isMultiStep: /* @__PURE__ */ required(Boolean),
  loading: Boolean,
  values: Object as PropType<Record<string, unknown>>,
  primaryLabel: String,
  showPrimary: optionalBoolean,
  primaryDisabled: optionalBoolean,
  showBack: optionalBoolean,
  backLabel: String,
  showSkip: optionalBoolean,
  skipLabel: String,
  testIds: Object as PropType<FormActionsView['testIds']>,
  rootProps,
};

export const formActionsEmits = {
  submit: () => true,
  next: () => true,
  back: () => true,
  cancel: () => true,
  skip: () => true,
  primary: () => true,
};

export const formStepProgressProps = {
  current: /* @__PURE__ */ required(Number),
  total: /* @__PURE__ */ required(Number),
  stepTitle: String,
  stepDescription: String,
  headingLevel: { type: Number as PropType<HeadingLevel>, default: 2 },
  steps: Array as PropType<FormStepStatus[]>,
  counterLabel: String,
  stepErrorCount: Number,
  stepErrorsLabel: String,
  marks: { type: Boolean, default: true },
  rootProps,
};

export const fieldsContainerProps = {
  rootProps: /* @__PURE__ */ required(rootProps),
};

export const errorSummaryComponentProps = {
  rootProps: /* @__PURE__ */ required(rootProps),
  title: /* @__PURE__ */ required(String),
  groups: /* @__PURE__ */ required(Array as PropType<ErrorSummaryGroup[]>),
  count: /* @__PURE__ */ required(Number),
  showField: /* @__PURE__ */ callback<(key: string) => void>(),
};

export const formErrorsComponentProps = {
  rootProps: /* @__PURE__ */ required(rootProps),
  errors: /* @__PURE__ */ required(Array as PropType<readonly string[]>),
};
