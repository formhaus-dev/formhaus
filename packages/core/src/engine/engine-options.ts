import type { ValidatorFn } from '../validation';

export type StepValidateFn = (
  stepId: string,
  values: Record<string, unknown>,
) => Promise<Record<string, string> | null | void>;

export interface FormEngineOptions {
  validators?: Record<string, ValidatorFn>;
  onStepValidate?: StepValidateFn;
}
