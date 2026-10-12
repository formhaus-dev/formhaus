import { checkDefinition, FormDefinitionError } from '../definition-validation';
import { isError } from '../definition-validation/issues';
import type { ValidatorFn } from '../validation';
import type { FormDefinition, FormField, FormStep } from '../types';
import type { FormEngineOptions, StepValidateFn, SubmitFn } from './engine-options';
import { createValues } from './engine-utils';
import { changeStep, goToStepWithField, skipStep } from './navigation';
import type { EngineInternals, EngineState, RuntimeNotifyOptions } from './runtime-internals';
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
import { submitForm } from './submission';
import { reconcileStepIndex } from './step-routes';
import { warnInDevelopment } from './warnings';
import { VisibilityState } from './visibility-state';

export class FormEngine<TValues extends Record<string, unknown> = Record<string, unknown>> {
  private readonly state: EngineState;
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
    initialValues?: Partial<TValues>,
    options?: FormEngineOptions,
  ) {
    this.lifecycle = options ?? {};
    this.validators = options?.validators ?? {};
    const issues = checkDefinition(definition, { validators: this.validators });
    const errors = issues.filter(isError);
    if (errors.length) throw new FormDefinitionError(errors);
    const warn = this.lifecycle.onWarning ?? warnInDevelopment;
    for (const issue of issues) warn(issue);
    this.visibility = new VisibilityState(definition);
    const values = createValues(this.visibility.allFields, initialValues);
    this.state = { values, errors: {}, topLevelErrors: [], currentStepIndex: 0, fieldLoading: {}, stepValidating: false, submitting: false };
    this.visibility.reconcileHidden(values, this.state.errors);
  }

  get values(): Readonly<Partial<TValues>> { return this.state.values as Partial<TValues>; }
  get errors(): Readonly<Record<string, string>> { return this.state.errors; }
  get topLevelErrors(): readonly string[] { return this.state.topLevelErrors; }
  get currentStepIndex(): number { return this.state.currentStepIndex; }
  get fieldLoading(): Readonly<Record<string, boolean>> { return this.state.fieldLoading; }
  get stepValidating(): boolean { return this.state.stepValidating; }
  get submitting(): boolean { return this.state.submitting; }

  get isMultiStep(): boolean {
    return (this.definition.steps ?? []).length > 0;
  }

  get visibleSteps(): FormStep[] {
    return this.visibility.state(this.state.values, this.currentStepIndex).visibleSteps;
  }

  get currentStep(): FormStep | null {
    return this.visibility.state(this.state.values, this.currentStepIndex).currentStep;
  }

  get visibleFields(): FormField[] {
    return this.visibility.state(this.state.values, this.currentStepIndex).visibleFields;
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex >= this.visibleSteps.length - 1;
  }

  get canGoNext(): boolean {
    return this.visibility.getCanGoNext(this.state.values, this.currentStepIndex, this.validators);
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
    const { values, errors } = this.state;
    const previousSteps = this.isMultiStep ? this.visibleSteps : null;
    const valueChanged = !Object.is(values[key], value);
    const hadError = errors[key] !== undefined;
    values[key] = value;
    delete errors[key];
    for (const [stepId, keys] of this.skipped) if (valueChanged && keys.includes(key)) this.skipped.delete(stepId);
    const clearedFields = this.visibility.cascadeHiddenFields(values, errors);
    const revalidated = clearResolvedMatchErrors(this.internals, key);
    const changedFields = new Set([...clearedFields, ...revalidated]);
    if (valueChanged || hadError) changedFields.add(key);
    const valuesChanged = valueChanged || clearedFields.size > 0;
    const structureChanged = valuesChanged && this.visibility.affectsStructure(key, clearedFields);
    if (previousSteps && structureChanged) {
      this.visibility.markChanged(true, true);
      this.state.currentStepIndex = reconcileStepIndex(previousSteps, this.visibleSteps, this.currentStepIndex);
      for (const pruned of pruneOffPathErrors(this.internals)) changedFields.add(pruned);
    }
    this.notify({ fieldKeys: changedFields, structureChanged, valuesChanged });
  }

  setErrors(errors: Record<string, string>): void {
    applyValidationErrors(this.internals, errors, true);
  }

  setFieldLoading(key: string, loading: boolean): void {
    const previous = this.state.fieldLoading[key] === true;
    if (loading) this.state.fieldLoading[key] = true;
    else delete this.state.fieldLoading[key];
    this.notify({ fieldKeys: previous === loading ? [] : [key] });
  }

  cancelPendingActions(): void {
    this.validationEpoch++;
    this.operationEpoch++;
    this.state.stepValidating = false;
    this.state.submitting = false;
    this.notify();
  }

  next(): Promise<boolean> { return changeStep(this.internals, 'next'); }
  back(): Promise<boolean> { return changeStep(this.internals, 'back'); }
  skip(submit?: SubmitFn): Promise<boolean> { return skipStep(this.internals, submit); }
  submit(handler: SubmitFn): Promise<boolean> { return submitForm(this.internals, handler); }
  isStepSkipped(stepId: string): boolean { return this.skipped.has(stepId); }
  validate(): Record<string, string> { return validateForm(this.internals); }
  validateField(key: string): string | null { return validateOne(this.internals, key); }
  getSubmitValues(): Partial<TValues> { return getSubmitValues(this.internals) as Partial<TValues>; }
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
