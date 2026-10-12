import type { FieldOption, FieldType, FormAction, FormAnalyticsEvent, FormDefinition, FormEngineOptions, StepValidateFn, SubmitFn, ValidatorFn } from '@formhaus/core';
import type { ComponentType } from 'react';

export type OptionsProvider = (
  values: Record<string, unknown>,
) => FieldOption[] | Promise<FieldOption[]>;

export interface FieldComponentProps {
  field: import('@formhaus/core').FormField;
  value: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
  onChange: (value: unknown) => void;
  onCommit?: (value: unknown) => void;
  onBlur: () => void;
  onFocus?: () => void;
}

export type FieldComponentMap = Partial<Record<FieldType, ComponentType<FieldComponentProps>>>;

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
  onSubmit: () => void;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
  onSkip?: () => void;
  onPrimary?: () => void;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface FormStepProgressProps {
  current: number;
  total: number;
  stepTitle?: string;
  stepDescription?: string;
  headingLevel?: HeadingLevel;
}

export interface FormRendererProps extends FormEngineOptions {
  onError?: (error: unknown) => void;
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  onSubmit: SubmitFn;
  onCancel?: () => void;
  onFieldChange?: (key: string, value: unknown, allValues: Record<string, unknown>) => void;
  validators?: Record<string, ValidatorFn>;
  onStepValidate?: StepValidateFn;
  errors?: Record<string, string>;
  loading?: boolean;
  components?: FieldComponentMap;
  optionsProviders?: Record<string, OptionsProvider>;
  actionsComponent?: ComponentType<FormActionsProps>;
  progressComponent?: ComponentType<FormStepProgressProps>;
  headingLevel?: HeadingLevel;
  onAnalyticsEvent?: (event: FormAnalyticsEvent) => void;
}
