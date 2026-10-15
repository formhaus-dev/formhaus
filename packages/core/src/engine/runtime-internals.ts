import type { ValidatorFn } from '../validation';
import type { ResolveMessage } from '../validation/default-messages';
import type { FormDefinition, FormField, FormStep } from '../types';
import type { FormEngineOptions, StepValidateFn } from './engine-options';
import type { NotifyOptions } from './subscriptions';
import type { VisibilityState } from './visibility-state';

export interface RuntimeNotifyOptions extends NotifyOptions {
  valuesChanged?: boolean;
}

export interface EngineState {
  values: Record<string, unknown>;
  errors: Record<string, string>;
  topLevelErrors: string[];
  serverErrors: Record<string, string>;
  serverFormErrors: string[];
  currentStepIndex: number;
  fieldLoading: Record<string, boolean>;
  stepValidating: boolean;
  submitting: boolean;
}

export interface EngineInternals {
  readonly definition: FormDefinition;
  readonly state: EngineState;
  readonly values: Record<string, unknown>;
  readonly errors: Record<string, string>;
  readonly topLevelErrors: string[];
  readonly currentStepIndex: number;
  readonly fieldLoading: Record<string, boolean>;
  readonly stepValidating: boolean;
  readonly submitting: boolean;
  validationEpoch: number;
  operationEpoch: number;
  latestOperation: number;
  readonly skipped: Map<string, string[]>;
  readonly lifecycle: FormEngineOptions;
  readonly validators: Record<string, ValidatorFn>;
  readonly messages: ResolveMessage;
  readonly onStepValidate?: StepValidateFn;
  readonly visibility: VisibilityState;
  readonly isMultiStep: boolean;
  readonly visibleSteps: FormStep[];
  readonly currentStep: FormStep | null;
  readonly visibleFields: FormField[];
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
  notify(options?: RuntimeNotifyOptions): void;
}
