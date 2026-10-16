import type {
  ConfirmDialogView,
  DefaultFieldType,
  FieldType,
  FormAction,
  FormAnalyticsEvent,
  FormDefinition,
  FormEngineOptions,
  GroupItemView,
  GroupView,
  LabelSource,
  OptionsProvider,
  SectionView,
  StepValidateFn,
  SubmitHandler,
  ValidatorFn,
} from '@formhaus/core';
import type { ComponentClass, ComponentType, FunctionComponent, ReactNode } from 'react';

export type { OptionsProvider };

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

export type ConfirmDialogComponentProps = ConfirmDialogView;

export interface GroupComponentProps extends GroupView<GroupItemComponentProps> {
  ItemComponent: ComponentType<GroupItemComponentProps>;
}

interface NodeComponentProps {
  section: SectionComponentProps;
  group: GroupComponentProps;
  groupItem: GroupItemComponentProps;
  confirmDialog: ConfirmDialogComponentProps;
}

type AnyComponentProps = FieldComponentProps &
  SectionComponentProps &
  GroupComponentProps &
  GroupItemComponentProps &
  ConfirmDialogComponentProps;

type ComponentClasses<P> = P extends unknown ? ComponentClass<P> : never;

type AnyComponent =
  | FunctionComponent<AnyComponentProps>
  | ComponentClasses<FieldComponentProps | NodeComponentProps[keyof NodeComponentProps]>;

export type FieldComponentMap = {
  [K in FieldType | keyof NodeComponentProps]?: K extends keyof NodeComponentProps
    ? ComponentType<NodeComponentProps[K]>
    : K extends DefaultFieldType
      ? ComponentType<FieldComponentProps>
      : AnyComponent;
};

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
