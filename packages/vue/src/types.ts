import type {
  FieldOption,
  FieldType,
  FormAction,
  FormAnalyticsEvent,
  FormField,
  FormSchema,
  ValidatorFn,
} from '@formhaus/core';
import type { Component } from 'vue';

export type FieldComponentMap = Record<FieldType, Component>;

export interface FormActionsProps {
  submitAction?: FormAction;
  backAction?: FormAction | false;
  cancelAction?: FormAction;
  isFirstStep: boolean;
  isLastStep: boolean;
  isMultiStep: boolean;
  loading?: boolean;
  primaryLabel?: string;
  showBack?: boolean;
  backLabel?: string;
}

export interface FormStepProgressProps {
  current: number;
  total: number;
  stepTitle?: string;
  stepDescription?: string;
}

export type OptionsProvider = (
  values: Record<string, unknown>,
) => FieldOption[] | Promise<FieldOption[]>;

export interface FormRendererProps {
  schema: FormSchema;
  initialValues?: Record<string, unknown>;
  errors?: Record<string, string>;
  loading?: boolean;
  components?: Partial<FieldComponentMap>;
  actionsComponent?: Component;
  progressComponent?: Component;
}

export interface FormRendererEmits {
  (e: 'submit', values: Record<string, unknown>): void;
  (e: 'cancel'): void;
  (e: 'stepChange', stepId: string, direction: 'next' | 'back'): void;
  (e: 'fieldChange', key: string, value: unknown, allValues: Record<string, unknown>): void;
  (e: 'analyticsEvent', event: FormAnalyticsEvent): void;
}

export interface FormFieldProps {
  field: FormField;
  value: unknown;
  error?: string;
  loading?: boolean;
  disabled?: boolean;
}
