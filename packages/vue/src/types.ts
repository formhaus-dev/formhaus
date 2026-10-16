import type {
  AfterStepChangeFn,
  BeforeStepChangeFn,
  BeforeSubmitFn,
  ConfirmDialogView,
  DefinitionIssue,
  FieldType,
  FormAction,
  FormAnalyticsEvent,
  FormDefinition,
  FormField,
  FormRendererHandle,
  GroupItemView,
  GroupView,
  LabelSource,
  MessageFn,
  MessageKey,
  OptionsProvider,
  SectionView,
  StepValidateFn,
  SubmitFn,
  SubmitHandler,
  ValidatorFn,
} from '@formhaus/core';
import type { Component } from 'vue';

export type FieldComponentMap = Partial<Record<FieldType, Component>>;

export type SectionComponentProps = SectionView;

export interface GroupItemComponentProps extends GroupItemView {
  fields: Component;
}

export type ConfirmDialogComponentProps = ConfirmDialogView;

export interface GroupComponentProps extends GroupView<GroupItemComponentProps> {
  itemComponent: Component;
}

export interface FormActionsProps {
  submitAction?: FormAction;
  nextAction?: FormAction | false;
  backAction?: FormAction | false;
  cancelAction?: FormAction;
  skipAction?: FormAction;
  isFirstStep: boolean;
  isLastStep: boolean;
  isMultiStep: boolean;
  loading?: boolean;
  values?: Record<string, unknown>;
  primaryLabel?: string;
  showPrimary?: boolean;
  showBack?: boolean;
  backLabel?: string;
  showSkip?: boolean;
  skipLabel?: string;
}

export interface FormStepStatus {
  id: string;
  title?: string;
  errorCount: number;
}

export interface FormStepProgressProps {
  current: number;
  total: number;
  stepTitle?: string;
  stepDescription?: string;
  headingLevel?: HeadingLevel;
  steps?: FormStepStatus[];
  counterLabel?: string;
}

export type { FormRendererHandle, OptionsProvider };

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

type Callback<T extends (...args: never[]) => unknown> = (...args: Parameters<T>) => ReturnType<T>;

export interface FormRendererProps {
  onBeforeStepChange?: Callback<BeforeStepChangeFn>;
  onAfterStepChange?: Callback<AfterStepChangeFn>;
  onBeforeSubmit?: Callback<BeforeSubmitFn>;
  onAfterSubmit?: Callback<SubmitFn>;
  onWarning?: (issue: DefinitionIssue) => void;
  messages?: Partial<Record<MessageKey, string>> | Callback<MessageFn>;
  onError?: (error: unknown) => void;
  onSubmit?: SubmitHandler;
  submitHandler?: SubmitHandler;
  headingLevel?: HeadingLevel;
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  validators?: Record<string, ValidatorFn>;
  onStepValidate?: Callback<StepValidateFn>;
  errors?: Record<string, string>;
  labels?: LabelSource;
  errorSummary?: boolean;
  confirmRemove?: boolean;
  stepErrorMarks?: boolean;
  loading?: boolean;
  components?: FieldComponentMap;
  actionsComponent?: Component;
  progressComponent?: Component;
  optionsProviders?: Record<string, OptionsProvider>;
}

export interface FormRendererEmits {
  (e: 'cancel'): void;
  (e: 'fieldChange', key: string, value: unknown, allValues: Record<string, unknown>): void;
  (e: 'analyticsEvent', event: FormAnalyticsEvent): void;
}

export interface FormFieldProps {
  id?: string;
  field: FormField;
  modelValue: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
}

export interface FieldResolverProps extends FormFieldProps {
  components?: FieldComponentMap;
}

export interface FieldEmits {
  (e: 'update:modelValue', value: unknown): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}

export interface CommitFieldEmits extends FieldEmits {
  (e: 'commit', value: unknown): void;
}
