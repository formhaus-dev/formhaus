import type { DefinitionIssue } from '../definition-validation';
import type { FormEvent, StepRedirectReason } from '../types/analytics';
import type { MessageSource, ValidatorFn } from '../validation';
import type { RecallFormatFn } from './recall-format';

export type StepValidateFn = (stepId: string, values: Record<string, unknown>) => Promise<Record<string, string> | null | void>;

export interface StepChangeContext {
  fromStepId: string;
  toStepId: string;
  reason: 'next' | 'back' | 'autoAdvance' | 'skip';
  values: Record<string, unknown>;
}

export type BeforeStepChangeFn = (context: StepChangeContext) => boolean | void | Promise<boolean | void>;
export type AfterStepChangeFn = (context: StepChangeContext) => void | Promise<void>;
export type BeforeSubmitFn = (values: Record<string, unknown>) => boolean | void | Promise<boolean | void>;
export type AfterSubmitFn = (values: Record<string, unknown>, skippedSteps: string[]) => void | Promise<void>;
export type GoToStepResult =
  | { stepId: string | null; reached: true }
  | { stepId: string | null; reached: false; reason: StepRedirectReason };
export type SubmitResult = { ok: true } | { ok: false; errors?: Record<string, string>; formErrors?: string[] };
export type SubmitHandler = (values: Record<string, unknown>, skippedSteps: string[]) => void | SubmitResult | Promise<void | SubmitResult>;

export interface FormEngineOptions {
  onBeforeStepChange?: BeforeStepChangeFn;
  onAfterStepChange?: AfterStepChangeFn;
  onBeforeSubmit?: BeforeSubmitFn;
  onAfterSubmit?: AfterSubmitFn;
  validators?: Record<string, ValidatorFn>;
  messages?: MessageSource;
  onStepValidate?: StepValidateFn;
  onWarning?: (issue: DefinitionIssue) => void;
  onFormEvent?: (event: FormEvent) => void;
  lang?: string;
  formatRecall?: RecallFormatFn;
}
