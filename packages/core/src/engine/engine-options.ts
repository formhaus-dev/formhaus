import type { ValidatorFn } from '../validation';

export type StepValidateFn = (
  stepId: string,
  values: Record<string, unknown>,
) => Promise<Record<string, string> | null | void>;

export interface StepChangeContext {
  fromStepId: string;
  toStepId: string;
  direction: 'next' | 'back';
  reason: 'next' | 'back' | 'autoAdvance' | 'skip';
  values: Record<string, unknown>;
}

export type BeforeStepChangeFn = (context: StepChangeContext) => boolean | void | Promise<boolean | void>;
export type AfterStepChangeFn = (context: StepChangeContext) => void | Promise<void>;
export type BeforeSubmitFn = (values: Record<string, unknown>) => boolean | void | Promise<boolean | void>;
export type SubmitFn = (values: Record<string, unknown>) => void | Promise<void>;

export interface FormEngineOptions {
  onBeforeStepChange?: BeforeStepChangeFn;
  onAfterStepChange?: AfterStepChangeFn;
  onBeforeSubmit?: BeforeSubmitFn;
  onAfterSubmit?: SubmitFn;
  validators?: Record<string, ValidatorFn>;
  onStepValidate?: StepValidateFn;
}
