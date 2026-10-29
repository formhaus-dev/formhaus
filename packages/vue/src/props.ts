import type {
  ErrorSummaryGroup,
  FieldOption,
  FormAction,
  FormActionsView,
  FormDefinition,
  FormField,
  FormGroup,
  FormResearch,
  FormSection,
  LabelSource,
  RevealView,
  RootProps,
} from '@formhaus/core';
import type { Component, PropType, VNode } from 'vue';
import type {
  FieldComponentMap,
  FieldComponentProps,
  FormRendererProps,
  FormStepStatus,
  GroupItemComponentProps,
  HeadingLevel,
  LayoutComponentMap,
} from './types';

export const required = <T>(type: PropType<T>) => ({ type, required: true as const });
export const any = <T>() => null as unknown as PropType<T>;
export const callback = <T extends (...args: never[]) => unknown>() => required(Function as PropType<T>);
const rootProps = Object as PropType<RootProps>;
export const labelSource = [Object, Function] as PropType<LabelSource>;

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
  reveals: Array as PropType<RevealView<VNode>[]>,
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

type Renderer = Required<FormRendererProps>;

export const formRendererProps = {
  onBeforeStepChange: Function as PropType<Renderer['onBeforeStepChange']>,
  onAfterStepChange: Function as PropType<Renderer['onAfterStepChange']>,
  onBeforeSubmit: Function as PropType<Renderer['onBeforeSubmit']>,
  onAfterSubmit: Function as PropType<Renderer['onAfterSubmit']>,
  onWarning: Function as PropType<Renderer['onWarning']>,
  messages: [Object, Function] as PropType<Renderer['messages']>,
  onError: Function as PropType<Renderer['onError']>,
  onSubmit: Function as PropType<Renderer['onSubmit']>,
  headingLevel: { type: Number as PropType<HeadingLevel>, default: 2 },
  definition: /* @__PURE__ */ required(Object as PropType<FormDefinition>),
  initialValues: Object as PropType<Renderer['initialValues']>,
  keepValues: Boolean,
  validators: Object as PropType<Renderer['validators']>,
  onStepValidate: Function as PropType<Renderer['onStepValidate']>,
  onValidate: Function as PropType<Renderer['onValidate']>,
  validateWithRules: Boolean,
  lang: String,
  locale: [Object, Array] as PropType<Renderer['locale']>,
  formatRecall: Function as PropType<Renderer['formatRecall']>,
  seed: String,
  research: Object as PropType<FormResearch>,
  hiddenValues: String as PropType<Renderer['hiddenValues']>,
  errors: Object as PropType<Renderer['errors']>,
  labels: labelSource,
  errorSummary: { type: [Boolean, String] as PropType<Renderer['errorSummary']>, default: true },
  confirmRemove: { type: Boolean, default: true },
  stepErrorMarks: Boolean,
  stepFocus: String as PropType<Renderer['stepFocus']>,
  conditionalReveal: Boolean,
  loading: { type: Boolean, default: false },
  components: Object as PropType<FieldComponentMap>,
  layout: Object as PropType<LayoutComponentMap>,
  actionsComponent: /* @__PURE__ */ any<Component>(),
  progressComponent: /* @__PURE__ */ any<Component>(),
  optionsProviders: Object as PropType<Renderer['optionsProviders']>,
  testIds: [Boolean, Function] as PropType<Renderer['testIds']>,
};
