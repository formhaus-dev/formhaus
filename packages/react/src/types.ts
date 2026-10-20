import type {
  ConfirmDialogView,
  DefaultFieldType,
  FieldType,
  FormActionsView,
  FormDefinition,
  FormEngineOptions,
  FormRendererHandle,
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

export type { FormRendererHandle, OptionsProvider };

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
  itemComponent: ComponentType<GroupItemComponentProps>;
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

export interface FormActionsProps extends FormActionsView {
  onSubmit: () => void;
  onNext: () => void;
  onBack: () => void;
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
  stepErrorCount?: number;
}

export interface FormRendererProps extends FormEngineOptions {
  onError?: (error: unknown) => void;
  definition: FormDefinition;
  initialValues?: Record<string, unknown>;
  keepValues?: boolean;
  onSubmit: SubmitHandler;
  onCancel?: () => void;
  onFieldChange?: (key: string, value: unknown, allValues: Record<string, unknown>) => void;
  onValuesChange?: (values: Readonly<Record<string, unknown>>) => void;
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
}
