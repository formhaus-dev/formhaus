import { validateDefinition } from '../definition-validation';
import type { ValidatorFn } from '../validation';
import type { FormDefinition, FormField, FormStep } from '../types';
import type { FormEngineOptions, StepValidateFn } from './engine-options';
import { createValues, getChangedKeys } from './engine-utils';
import { goToStepWithField, nextStep, nextStepAsync, prevStep } from './navigation';
import type { EngineInternals, RuntimeNotifyOptions } from './runtime-internals';
import { FormSubscriptions, type NotifyOptions } from './subscriptions';
import {
  applyExternalErrors,
  getSubmitValues,
  resetEngine,
  validateForm,
  validateOne,
  assertDefinitionShape,
} from './validation-state';
import { VisibilityState } from './visibility-state';

export class FormEngine {
  values: Record<string, unknown>;
  errors: Record<string, string> = {};
  topLevelErrors: string[] = [];
  currentStepIndex = 0;
  fieldLoading: Record<string, boolean> = {};
  stepValidating = false;
  private validationEpoch = 0;

  private readonly validators: Record<string, ValidatorFn>;
  private readonly onStepValidate?: StepValidateFn;
  private readonly visibility: VisibilityState;
  private readonly subscriptions = new FormSubscriptions();

  constructor(
    readonly definition: FormDefinition,
    initialValues?: Record<string, unknown>,
    options?: FormEngineOptions,
  ) {
    assertDefinitionShape(definition);
    for (const warning of validateDefinition(definition)) {
      console.warn(`[FormEngine] ${warning}`);
    }
    this.validators = options?.validators ?? {};
    this.onStepValidate = options?.onStepValidate;
    this.visibility = new VisibilityState(definition);
    this.values = createValues(this.visibility.allFields, initialValues);
    this.visibility.reconcileHidden(this.values, this.errors);
  }

  get isMultiStep(): boolean {
    return (this.definition.steps ?? []).length > 0;
  }

  get visibleSteps(): FormStep[] {
    return this.visibility.getVisibleSteps(this.values, this.currentStepIndex);
  }

  get currentStep(): FormStep | null {
    return this.visibility.getCurrentStep(this.values, this.currentStepIndex);
  }

  get visibleFields(): FormField[] {
    return this.visibility.getVisibleFields(this.values, this.currentStepIndex);
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
    const valueChanged = !Object.is(this.values[key], value);
    const hadError = this.errors[key] !== undefined;
    this.values[key] = value;
    delete this.errors[key];
    const clearedFields = this.visibility.cascadeHiddenFields(key, this.values, this.errors);
    const changedFields = new Set(clearedFields);
    if (valueChanged || hadError) changedFields.add(key);
    const valuesChanged = valueChanged || clearedFields.size > 0;
    const structureChanged = valuesChanged && this.visibility.affectsStructure(key, clearedFields);
    this.notify({ fieldKeys: changedFields, structureChanged, valuesChanged });
  }

  setErrors(errors: Record<string, string>): void {
    applyExternalErrors(this.internals, errors);
  }

  setFieldLoading(key: string, loading: boolean): void {
    const previous = this.fieldLoading[key] === true;
    if (loading) this.fieldLoading[key] = true;
    else delete this.fieldLoading[key];
    this.notify({ fieldKeys: previous === loading ? [] : [key] });
  }

  nextStep(): boolean { return nextStep(this.internals); }
  nextStepAsync(): Promise<boolean> { return nextStepAsync(this.internals); }
  prevStep(): void { prevStep(this.internals); }
  validate(): Record<string, string> { return validateForm(this.internals); }
  validateField(key: string): string | null { return validateOne(this.internals, key); }
  getSubmitValues(): Record<string, unknown> { return getSubmitValues(this.internals); }
  goToStepWithField(key: string): void { goToStepWithField(this.internals, key); }
  reset(values?: Record<string, unknown>): void { resetEngine(this.internals, values); }

  private get internals(): EngineInternals {
    return this as unknown as EngineInternals;
  }

  private getChangedKeys = getChangedKeys;

  private notify(options: RuntimeNotifyOptions = {}): void {
    this.visibility.markChanged(!!options.structureChanged, !!options.valuesChanged);
    this.subscriptions.notify(options);
  }
}
