import type {
  FieldOption,
  FieldType,
  FormAction,
  FormAnalyticsEvent,
  FormDefinition,
  FormEngineOptions,
  GroupItemView,
  GroupView,
  LabelSource,
  SectionView,
  StepValidateFn,
  SubmitHandler,
  ValidatorFn,
} from '@formhaus/core';
import type { ComponentType, ReactNode } from 'react';

export type OptionsProvider = (values: Record<string, unknown>) => FieldOption[] | Promise<FieldOption[]>;

export interface FieldComponentProps {
  id?: string;
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

export interface SectionComponentProps extends SectionView {
  children: ReactNode;
}

export interface GroupItemComponentProps extends GroupItemView {
  children: ReactNode;
}

export interface GroupComponentProps extends GroupView<GroupItemComponentProps> {
  ItemComponent: ComponentType<GroupItemComponentProps>;
}

export type FieldComponentMap = Partial<
  Record<
    FieldType,
    | ComponentType<FieldComponentProps>
    | ComponentType<SectionComponentProps>
    | ComponentType<GroupComponentProps>
    | ComponentType<GroupItemComponentProps>
  >
>;

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
  onSubmit: () => void;
  onNext: () => void;
  onPrev: () => void;
  onCancel: () => void;
  onSkip?: () => void;
  onPrimary?: () => void;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

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

export interface FormRendererProps extends FormEngineOptions {
  onError?: (error: unknown) => void;
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  onSubmit: SubmitHandler;
  onCancel?: () => void;
  onFieldChange?: (key: string, value: unknown, allValues: Record<string, unknown>) => void;
  validators?: Record<string, ValidatorFn>;
  onStepValidate?: StepValidateFn;
  errors?: Record<string, string>;
  labels?: LabelSource;
  errorSummary?: boolean;
  confirmRemove?: boolean;
  stepErrorMarks?: boolean;
  loading?: boolean;
  components?: FieldComponentMap;
  optionsProviders?: Record<string, OptionsProvider>;
  actionsComponent?: ComponentType<FormActionsProps>;
  progressComponent?: ComponentType<FormStepProgressProps>;
  headingLevel?: HeadingLevel;
  onAnalyticsEvent?: (event: FormAnalyticsEvent) => void;
}
