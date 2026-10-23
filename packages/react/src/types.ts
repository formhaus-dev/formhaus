import type {
  ConfirmDialogView,
  DefaultFieldType,
  ErrorSummaryView,
  FieldOption,
  FieldType,
  FormActionsView,
  FormDefinition,
  FormEngineOptions,
  FormErrorsView,
  FormRendererHandle,
  FormStepProgressView,
  FormStepStatus,
  GroupItemView,
  GroupView,
  LabelSource,
  OptionsProvider,
  RootProps,
  SectionView,
  StepValidateFn,
  SubmitHandler,
  TestIdTarget,
  ValidatorFn,
} from '@formhaus/core';
import type { ComponentClass, ComponentType, FunctionComponent, ReactNode } from 'react';

export type { FormRendererHandle, FormStepStatus, OptionsProvider, RootProps };

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
  testId?: string;
  optionTestId?: (value: string) => string | undefined;
  matrix?: { columns: FieldOption[]; row: number };
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

export type ErrorSummaryComponentProps = ErrorSummaryView;

export type FormErrorsComponentProps = FormErrorsView;

export interface FieldsContainerProps {
  rootProps: RootProps;
  children: ReactNode;
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
  rootProps?: RootProps;
}

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type FormStepProgressProps = FormStepProgressView;

export interface LayoutComponentMap {
  fields?: ComponentType<FieldsContainerProps>;
  section?: ComponentType<SectionComponentProps>;
  group?: ComponentType<GroupComponentProps>;
  groupItem?: ComponentType<GroupItemComponentProps>;
  confirmDialog?: ComponentType<ConfirmDialogComponentProps>;
  errorSummary?: ComponentType<ErrorSummaryComponentProps>;
  formErrors?: ComponentType<FormErrorsComponentProps>;
  progress?: ComponentType<FormStepProgressProps>;
  actions?: ComponentType<FormActionsProps>;
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
  layout?: LayoutComponentMap;
  optionsProviders?: Record<string, OptionsProvider>;
  actionsComponent?: ComponentType<FormActionsProps>;
  progressComponent?: ComponentType<FormStepProgressProps>;
  headingLevel?: HeadingLevel;
  testIds?: boolean | ((target: TestIdTarget) => string | undefined);
}
