import type { FieldType, FormAction, FormAnalyticsEvent, FormSchema, ValidatorFn } from '@formhaus/core';
import type { ComponentType } from 'react';

export interface FieldComponentProps {
  field: import('@formhaus/core').FormField;
  value: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}

export type FieldComponentMap = Partial<Record<FieldType, ComponentType<FieldComponentProps>>>;

export interface FormActionsProps {
  submitAction?: FormAction;
  backAction?: FormAction | false;
  cancelAction?: FormAction;
  isFirstStep: boolean;
  isLastStep: boolean;
  isMultiStep: boolean;
  loading?: boolean;
  onSubmit: () => void;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
}

export interface FormStepProgressProps {
  current: number;
  total: number;
  stepTitle?: string;
  stepDescription?: string;
}

export interface FormRendererProps {
  schema: FormSchema;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>) => Promise<void> | void;
  onCancel?: () => void;
  onStepChange?: (stepId: string, direction: 'next' | 'back') => void;
  onFieldChange?: (key: string, value: unknown, allValues: Record<string, unknown>) => void;
  validators?: Record<string, ValidatorFn>;
  errors?: Record<string, string>;
  loading?: boolean;
  components?: FieldComponentMap;
  ActionsComponent?: ComponentType<FormActionsProps>;
  ProgressComponent?: ComponentType<FormStepProgressProps>;
  onAnalyticsEvent?: (event: FormAnalyticsEvent) => void;
}
