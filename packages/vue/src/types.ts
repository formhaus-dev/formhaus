import type {
  FieldOption,
  FieldType,
  FormAction,
  FormAnalyticsEvent,
  FormField,
  FormDefinition,
  FormEngineOptions,
  StepValidateFn,
  SubmitFn,
  ValidatorFn,
} from '@formhaus/core';
import type { Component } from 'vue';

export type FieldComponentMap = Partial<Record<FieldType, Component>>;

export interface FormActionsProps {
  submitAction?: FormAction;
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

export interface FormStepProgressProps {
  current: number;
  total: number;
  stepTitle?: string;
  stepDescription?: string;
  headingLevel?: HeadingLevel;
}

export type OptionsProvider = (
  values: Record<string, unknown>,
) => FieldOption[] | Promise<FieldOption[]>;

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface FormRendererProps extends FormEngineOptions {
  onError?: (error: unknown) => void;
  onSubmit?: SubmitFn;
  submitHandler?: SubmitFn;
  headingLevel?: HeadingLevel;
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  validators?: Record<string, ValidatorFn>;
  onStepValidate?: StepValidateFn;
  errors?: Record<string, string>;
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
