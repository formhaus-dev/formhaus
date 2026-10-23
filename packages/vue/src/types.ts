import type {
  AfterStepChangeFn,
  BeforeStepChangeFn,
  BeforeSubmitFn,
  ConfirmDialogView,
  DefinitionIssue,
  ErrorSummaryView,
  FieldOption,
  FieldType,
  FormEvent,
  FormActionsView,
  FormDefinition,
  FormErrorsView,
  FormField,
  FormRendererHandle,
  FormStepProgressView,
  FormStepStatus,
  FormResearch,
  GroupItemView,
  GroupView,
  LabelSource,
  LocaleCatalog,
  MessageFn,
  MessageKey,
  OptionsProvider,
  RecallFormatFn,
  RootProps,
  SectionView,
  StepValidateFn,
  ValidateFn,
  AfterSubmitFn,
  SubmitHandler,
  TestIdTarget,
  ValidatorFn,
} from '@formhaus/core';
import type { Component, ComponentOptionsMixin, DefineComponent, EmitsOptions } from 'vue';

export type FieldComponentMap = Partial<Record<FieldType | 'section' | 'group' | 'groupItem' | 'confirmDialog', Component>>;

export type SectionComponentProps = SectionView;

export interface GroupItemComponentProps extends GroupItemView {
  fields: Component;
}

export type ConfirmDialogComponentProps = ConfirmDialogView;

export interface GroupComponentProps extends GroupView<GroupItemComponentProps> {
  itemComponent: Component;
}

export type ErrorSummaryComponentProps = ErrorSummaryView;

export type FormErrorsComponentProps = FormErrorsView;

export interface FieldsContainerProps {
  rootProps: RootProps;
}

export interface FormActionsProps extends FormActionsView {
  rootProps?: RootProps;
}

export type FormStepProgressProps = FormStepProgressView;

export interface LayoutComponentMap {
  fields?: Component;
  section?: Component;
  group?: Component;
  groupItem?: Component;
  confirmDialog?: Component;
  errorSummary?: Component;
  formErrors?: Component;
  progress?: Component;
  actions?: Component;
}

export type { FormRendererHandle, FormStepStatus, OptionsProvider, RootProps };

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type Callback<T extends (...args: never[]) => unknown> = (...args: Parameters<T>) => ReturnType<T>;

export interface FormRendererProps {
  onBeforeStepChange?: Callback<BeforeStepChangeFn>;
  onAfterStepChange?: Callback<AfterStepChangeFn>;
  onBeforeSubmit?: Callback<BeforeSubmitFn>;
  onAfterSubmit?: Callback<AfterSubmitFn>;
  onWarning?: (issue: DefinitionIssue) => void;
  messages?: Partial<Record<MessageKey, string>> | Callback<MessageFn>;
  onError?: (error: unknown) => void;
  onSubmit?: SubmitHandler;
  headingLevel?: HeadingLevel;
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  keepValues?: boolean;
  validators?: Record<string, ValidatorFn>;
  onStepValidate?: Callback<StepValidateFn>;
  onValidate?: Callback<ValidateFn>;
  lang?: string;
  locale?: LocaleCatalog | LocaleCatalog[];
  formatRecall?: Callback<RecallFormatFn>;
  seed?: string | undefined;
  research?: FormResearch | undefined;
  hiddenValues?: 'clear' | 'keep' | undefined;
  errors?: Record<string, string>;
  labels?: LabelSource;
  errorSummary?: boolean;
  confirmRemove?: boolean;
  stepErrorMarks?: boolean;
  loading?: boolean;
  components?: FieldComponentMap;
  layout?: LayoutComponentMap;
  actionsComponent?: Component;
  progressComponent?: Component;
  optionsProviders?: Record<string, OptionsProvider>;
  testIds?: boolean | ((target: TestIdTarget) => string | undefined);
}

export interface FormRendererEmits {
  (e: 'cancel'): void;
  (e: 'fieldChange', key: string, value: unknown, allValues: Record<string, unknown>): void;
  (e: 'valuesChange', values: Readonly<Record<string, unknown>>): void;
  (e: 'formEvent', event: FormEvent): void;
}

export type FormRendererEvents = {
  cancel: [];
  fieldChange: [key: string, value: unknown, allValues: Record<string, unknown>];
  valuesChange: [values: Readonly<Record<string, unknown>>];
  formEvent: [event: FormEvent];
};

export interface FieldComponentProps {
  id?: string;
  field: FormField;
  modelValue: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
  testId?: string;
  optionTestId?: (value: string) => string | undefined;
  matrix?: { columns: FieldOption[]; row: number };
}

export interface FieldResolverProps extends FieldComponentProps {
  components?: FieldComponentMap;
}

export interface FieldEmits {
  (e: 'update:modelValue', value: unknown): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}

type Empty = Record<never, never>;

export type TypedComponent<Props, Emits extends EmitsOptions = Empty, Exposed = Empty> = DefineComponent<
  Props,
  Exposed,
  Empty,
  Empty,
  Empty,
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  Emits
>;

export type WithSlots<T, Slots> = T & (new () => { $slots: Slots });

export type EmitsOf<T extends Record<string, unknown[] | ((...args: never[]) => unknown)>> = {
  [K in keyof T]: (...args: T[K] extends unknown[] ? T[K] : T[K] extends (...args: infer A) => unknown ? A : never) => void;
};
