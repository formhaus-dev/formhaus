import type { ValidatorFn } from '../validation';
import type { FormDefinition, FormField, FormStep } from '../types';
import type { StepValidateFn } from './engine-options';
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
  readonly validators: Record<string, ValidatorFn>;
  readonly onStepValidate?: StepValidateFn;
  readonly visibility: VisibilityState;
  readonly isMultiStep: boolean;
  readonly visibleSteps: FormStep[];
  readonly currentStep: FormStep | null;
  readonly visibleFields: FormField[];
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
  getChangedKeys(
    previous: Record<string, unknown>,
    next: Record<string, unknown>,
  ): Set<string>;
  notify(options?: RuntimeNotifyOptions): void;
}
