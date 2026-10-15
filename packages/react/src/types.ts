import type {
  FieldOption,
  FieldType,
  FormGroup,
  FormSection,
  FormAction,
  FormAnalyticsEvent,
  FormDefinition,
  FormEngineOptions,
  LabelSource,
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

export interface SectionComponentProps {
  id: string;
  section: FormSection;
  title: string;
  description?: string;
  descriptionId?: string;
  children: ReactNode;
}

export interface GroupItemComponentProps {
  id: string;
  index: number;
  title: string;
  titleId: string;
  canRemove: boolean;
  remove: () => void;
  requestRemove: () => void;
  cancelRemove: () => void;
  confirming: boolean;
  hasContent: boolean;
  prompt: string;
  keepLabel: string;
  removeLabel: string;
  disabled?: boolean;
  children: ReactNode;
}

export interface GroupComponentProps {
  id: string;
  group: FormGroup;
  label: string;
  helperText?: string;
  error?: string;
  describedBy?: string;
  items: GroupItemComponentProps[];
  canAdd: boolean;
  add: () => void;
  remove: (id: string) => void;
  requestRemove: (id: string) => void;
  addLabel: string;
  removeLabel: string;
  disabled?: boolean;
  status: string;
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
