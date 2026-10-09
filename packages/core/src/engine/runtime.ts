import { validateDefinition } from '../definition-validation';
import type { ValidatorFn } from '../validation';
import type { FormDefinition, FormField, FormStep } from '../types';
import type { FormEngineOptions, StepValidateFn, SubmitFn } from './engine-options';
import { createValues } from './engine-utils';
import { changeStep, goToStepWithField, nextStep, prevStep, skipStep, skipStepAsync } from './navigation';
import type { EngineInternals, RuntimeNotifyOptions } from './runtime-internals';
import { FormSubscriptions, type NotifyOptions } from './subscriptions';
import {
  applyValidationErrors,
  getSubmitValues,
  resetEngine,
  validateForm,
  validateOne,
  clearResolvedMatchErrors,
  pruneOffPathErrors,
} from './validation-state';
import { submitAsync } from './submission';
import { definitionErrors, reconcileStepIndex } from './step-routes';
import { VisibilityState } from './visibility-state';

export class FormEngine {
  values: Record<string, unknown>;
  errors: Record<string, string> = {};
  topLevelErrors: string[] = [];
  currentStepIndex = 0;
  fieldLoading: Record<string, boolean> = {};
  stepValidating = false;
  submitting = false;
  private readonly skipped = new Map<string, string[]>();
  private validationEpoch = 0;
  private operationEpoch = 0;
  private readonly lifecycle: FormEngineOptions;

  private readonly validators: Record<string, ValidatorFn>;
  private get onStepValidate(): StepValidateFn | undefined { return this.lifecycle.onStepValidate; }
  private readonly visibility: VisibilityState;
  private readonly subscriptions = new FormSubscriptions();

  constructor(
    readonly definition: FormDefinition,
    initialValues?: Record<string, unknown>,
    options?: FormEngineOptions,
  ) {
    const errors = definitionErrors(definition);
    if (errors.length) throw new Error(errors.join('\n'));
    this.lifecycle = options ?? {};
    this.validators = options?.validators ?? {};
    this.visibility = new VisibilityState(definition);
    const warnings = validateDefinition(definition);
    for (const { key, validation } of this.visibility.allFields) {
      const name = validation?.validator;
      if (name && !this.validators[name]) warnings.push(`Field "${key}" references unknown validator "${name}".`);
    }
    for (const warning of warnings) console.warn(`[FormEngine] ${warning}`);
    this.values = createValues(this.visibility.allFields, initialValues);
    this.visibility.reconcileHidden(this.values, this.errors);
  }

  get isMultiStep(): boolean {
    return (this.definition.steps ?? []).length > 0;
  }

  get visibleSteps(): FormStep[] {
    return this.visibility.state(this.values, this.currentStepIndex).visibleSteps;
  }

  get currentStep(): FormStep | null {
    return this.visibility.state(this.values, this.currentStepIndex).currentStep;
  }

  get visibleFields(): FormField[] {
    return this.visibility.state(this.values, this.currentStepIndex).visibleFields;
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex >= this.visibleSteps.length - 1;
  }

  get canGoNext(): boolean {
    return this.visibility.getCanGoNext(this.values, this.currentStepIndex, this.validators);
  }

  get progress(): { current: number; total: number } {
    const total = this.visibleSteps.length;
    return { current: Math.min(this.currentStepIndex + 1, total), total };
  }

  subscribe(listener: () => void): () => void {
    return this.subscriptions.subscribe(listener);
  }

  getSnapshot(): number {
    return this.subscriptions.getSnapshot();
  }

  subscribeField(key: string, listener: () => void): () => void {
    return this.subscriptions.subscribeField(key, listener);
  }

  getFieldSnapshot(key: string): number {
    return this.subscriptions.getFieldSnapshot(key);
  }

  subscribeStructure(listener: () => void): () => void {
    return this.subscriptions.subscribeStructure(listener);
  }

  getStructureSnapshot(): number {
    return this.subscriptions.getStructureSnapshot();
  }

  setValue(key: string, value: unknown): void {
    const previousSteps = this.isMultiStep ? this.visibleSteps : null;
    const valueChanged = !Object.is(this.values[key], value);
    const hadError = this.errors[key] !== undefined;
    this.values[key] = value;
    delete this.errors[key];
    for (const [stepId, keys] of this.skipped) if (valueChanged && keys.includes(key)) this.skipped.delete(stepId);
    const clearedFields = this.visibility.cascadeHiddenFields(key, this.values, this.errors);
    const revalidated = clearResolvedMatchErrors(this.internals, key);
    const changedFields = new Set([...clearedFields, ...revalidated]);
    if (valueChanged || hadError) changedFields.add(key);
    const valuesChanged = valueChanged || clearedFields.size > 0;
    const structureChanged = valuesChanged && this.visibility.affectsStructure(key, clearedFields);
    if (previousSteps && structureChanged) {
      this.visibility.markChanged(true, true);
      this.currentStepIndex = reconcileStepIndex(previousSteps, this.visibleSteps, this.currentStepIndex);
      for (const pruned of pruneOffPathErrors(this.internals)) changedFields.add(pruned);
    }
    this.notify({ fieldKeys: changedFields, structureChanged, valuesChanged });
  }

  setErrors(errors: Record<string, string>): void {
    applyValidationErrors(this.internals, errors, true);
  }

  setFieldLoading(key: string, loading: boolean): void {
    const previous = this.fieldLoading[key] === true;
    if (loading) this.fieldLoading[key] = true;
    else delete this.fieldLoading[key];
    this.notify({ fieldKeys: previous === loading ? [] : [key] });
  }

  cancelPendingActions(): void {
    this.validationEpoch++;
    this.operationEpoch++;
    this.stepValidating = false;
    this.submitting = false;
    this.notify();
  }

  nextStep(): boolean { return nextStep(this.internals); }
  nextStepAsync(reason: 'next' | 'autoAdvance' = 'next'): Promise<boolean> { return changeStep(this.internals, 'next', reason); }
  prevStepAsync(): Promise<boolean> { return changeStep(this.internals, 'back'); }
  skipStep(): boolean { return skipStep(this.internals); }
  skipStepAsync(submit?: SubmitFn): Promise<boolean> { return skipStepAsync(this.internals, submit); }
  isStepSkipped(stepId: string): boolean { return this.skipped.has(stepId); }
  submitAsync(submit: SubmitFn): Promise<boolean> { return submitAsync(this.internals, submit); }
  prevStep(): void { prevStep(this.internals); }
  validate(): Record<string, string> { return validateForm(this.internals); }
  validateField(key: string): string | null { return validateOne(this.internals, key); }
  getSubmitValues(): Record<string, unknown> { return getSubmitValues(this.internals); }
  goToStepWithField(key: string): void { goToStepWithField(this.internals, key); }
  reset(values?: Record<string, unknown>): void { resetEngine(this.internals, values); }

  private get internals(): EngineInternals {
    return this as unknown as EngineInternals;
  }

  private notify(options: RuntimeNotifyOptions = {}): void {
    this.visibility.markChanged(!!options.structureChanged, !!options.valuesChanged);
    this.subscriptions.notify(options);
  }
}
