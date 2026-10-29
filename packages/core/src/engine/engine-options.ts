import type { DefinitionIssue } from '../definition-validation';
import type { FormEvent, GoToStepResult } from '../types/analytics';
import type { MessageSource, ValidatorFn } from '../validation';
import type { FieldOption, LocaleSource } from '../types';
import type { RecallFormatFn } from './recall-format';

export type { GoToStepResult };

export type StepValidateFn = (
  stepId: string,
  values: Record<string, unknown>,
  signal: AbortSignal,
) => Promise<Record<string, string> | null | void>;

export interface ValidateContext {
  stepId?: string;
  fields: string[];
  submit: boolean;
}

export type ValidateFn = (
  values: Record<string, unknown>,
  context: ValidateContext,
  signal: AbortSignal,
) => Record<string, string> | null | void | Promise<Record<string, string> | null | void>;

export interface StepChangeContext {
  fromStepId: string;
  toStepId: string;
  reason: 'next' | 'back' | 'autoAdvance' | 'skip';
  values: Record<string, unknown>;
}

export type BeforeStepChangeFn = (context: StepChangeContext, signal: AbortSignal) => boolean | void | Promise<boolean | void>;
export type AfterStepChangeFn = (context: StepChangeContext) => void | Promise<void>;
export type BeforeSubmitFn = (values: Record<string, unknown>, signal: AbortSignal) => boolean | void | Promise<boolean | void>;
export type AfterSubmitFn = (values: Record<string, unknown>, skippedSteps: string[]) => void | Promise<void>;
export type SubmitResult = { ok: true } | { ok: false; errors?: Record<string, string>; formErrors?: string[] };
export type SubmitHandler = (values: Record<string, unknown>, skippedSteps: string[]) => void | SubmitResult | Promise<void | SubmitResult>;

export interface FormResearch {
  seed(): string;
  order(seed: string, key: string, options: FieldOption[]): FieldOption[];
}

export interface FormEngineOptions {
  onBeforeStepChange?: BeforeStepChangeFn;
  onAfterStepChange?: AfterStepChangeFn;
  onBeforeSubmit?: BeforeSubmitFn;
  onAfterSubmit?: AfterSubmitFn;
  validators?: Record<string, ValidatorFn>;
  messages?: MessageSource;
  locale?: LocaleSource | LocaleSource[];
  onStepValidate?: StepValidateFn;
  onValidate?: ValidateFn;
  validateWithRules?: boolean;
  onWarning?: (issue: DefinitionIssue) => void;
  onFormEvent?: (event: FormEvent) => void;
  lang?: string;
  formatRecall?: RecallFormatFn;
  seed?: string | undefined;
  research?: FormResearch | undefined;
  hiddenValues?: 'clear' | 'keep' | undefined;
}
