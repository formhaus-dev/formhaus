import type {
  AfterStepChangeFn,
  BeforeStepChangeFn,
  BeforeSubmitFn,
  ConfirmDialogView,
  DefinitionIssue,
  FieldType,
  FormEvent,
  FormActionsView,
  FormDefinition,
  FormField,
  FormRendererHandle,
  FormResearch,
  GroupItemView,
  GroupView,
  LabelSource,
  MessageFn,
  MessageKey,
  OptionsProvider,
  RecallFormatFn,
  SectionView,
  StepValidateFn,
  AfterSubmitFn,
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

export interface FormActionsProps extends FormActionsView {}

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
  stepErrorCount?: number;
}

export type { FormRendererHandle, OptionsProvider };

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
  lang?: string;
  formatRecall?: Callback<RecallFormatFn>;
  seed?: string | undefined;
  research?: FormResearch | undefined;
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
  (e: 'valuesChange', values: Readonly<Record<string, unknown>>): void;
  (e: 'formEvent', event: FormEvent): void;
}

export interface FieldComponentProps {
  id?: string;
  field: FormField;
  modelValue: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
}

export interface FieldResolverProps extends FieldComponentProps {
  components?: FieldComponentMap;
}

export interface FieldEmits {
  (e: 'update:modelValue', value: unknown): void;
  (e: 'blur'): void;
  (e: 'focus'): void;
}
