import type { ValidatorFn } from '../validation';
import type { FormDefinition, FormField, FormStep } from '../types';
import type { FormEngineOptions, StepValidateFn } from './engine-options';
import type { NotifyOptions } from './subscriptions';
import type { VisibilityState } from './visibility-state';

export interface RuntimeNotifyOptions extends NotifyOptions {
  valuesChanged?: boolean;
}

export interface EngineInternals {
  readonly definition: FormDefinition;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  topLevelErrors: string[];
  currentStepIndex: number;
  fieldLoading: Record<string, boolean>;
  stepValidating: boolean;
  validationEpoch: number;
  operationEpoch: number;
  submitting: boolean;
  readonly skipped: Map<string, string[]>;
  readonly lifecycle: FormEngineOptions;
  readonly validators: Record<string, ValidatorFn>;
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
