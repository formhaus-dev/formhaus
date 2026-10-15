import type { ValidatorFn } from '../validation';
import { messageResolver, type ResolveMessage } from '../validation/default-messages';
import type { FormDefinition, FormField, FormNode, FormStep } from '../types';
import type { FormEngineOptions, StepValidateFn, SubmitHandler } from './engine-options';
import { createValues, initialState } from './engine-utils';
import { addItem, groupItems, removeItem, setItemValue, type GroupItem } from './groups';
import { changeStep, goToStepWithField, skipStep } from './navigation';
import type { EngineState, RuntimeNotifyOptions } from './runtime-internals';
import { createSubscriptions, type NotifyOptions } from './subscriptions';
import { applyValidationErrors, errorKeys, getSubmitValues, resetEngine, validateForm, validateOne } from './validation-state';
import { submitForm } from './submission';
import { assertDefinition } from './warnings';
import { writeValue } from './write-value';
import { createVisibility, type VisibilityState } from './visibility-state';

export class FormEngine<TValues extends object = Record<string, unknown>> {
  private readonly state: EngineState;
  private readonly skipped = new Map<string, string[]>();
  private validationEpoch = 0;
  private operationEpoch = 0;
  private latestOperation = 0;
  private readonly lifecycle: FormEngineOptions;

  private readonly validators: Record<string, ValidatorFn>;
  private readonly messages: ResolveMessage;
  private get onStepValidate(): StepValidateFn | undefined {
    return this.lifecycle.onStepValidate;
  }
  private readonly visibility: VisibilityState;
  private readonly subscriptions = createSubscriptions();

  constructor(
    readonly definition: FormDefinition,
    initialValues?: Partial<NoInfer<TValues>>,
    options?: FormEngineOptions,
  ) {
    this.lifecycle = options ?? {};
    this.validators = options?.validators ?? {};
    assertDefinition(definition, this.lifecycle, this.validators);
    this.messages = messageResolver(options?.messages, definition.messages);
    this.visibility = createVisibility(definition);
    const values = createValues(this.visibility.allFields, initialValues as Record<string, unknown> | undefined);
    this.state = initialState(values);
    this.visibility.reconcileHidden(values, this.state.errors, true);
  }

  get values(): Readonly<Partial<TValues>> {
    return this.state.values as Partial<TValues>;
  }
  get errors(): Readonly<Record<string, string>> {
    return this.state.errors;
  }
  get topLevelErrors(): readonly string[] {
    const { errors, topLevelErrors, values } = this.state;
    return [
      ...topLevelErrors,
      ...this.visibility.allFields.flatMap(
        (field) =>
          (field.type === 'hidden' &&
            errors[field.key] &&
            (this.visibility.activeField(field.key, values) ?? field) === field &&
            errors[field.key]) ||
          [],
      ),
    ];
  }
  get currentStepIndex(): number {
    return this.state.currentStepIndex;
  }
  get fieldLoading(): Readonly<Record<string, boolean>> {
    return this.state.fieldLoading;
  }
  get stepValidating(): boolean {
    return this.state.stepValidating;
  }
  get submitting(): boolean {
    return this.state.submitting;
  }

  get isMultiStep(): boolean {
    return (this.definition.steps ?? []).length > 0;
  }

  get visibleSteps(): FormStep[] {
    return this.view.visibleSteps;
  }

  get currentStep(): FormStep | null {
    return this.view.currentStep;
  }

  get visibleFields(): FormField[] {
    return this.view.visibleFields;
  }

  get visibleNodes(): FormNode[] {
    return this.view.visibleNodes;
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

  get stepErrors(): Record<string, string[]> {
    const result: Record<string, string[]> = Object.create(null);
    for (const step of this.visibleSteps) {
      const keys = errorKeys(step.fields, this.errors, this.state.values);
      if (keys.length > 0) result[step.id] = keys;
    }
    return result;
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
    const path = this.visibility.parse(key);
    if (path) setItemValue(this as never, path[0], path[1], path[2], value);
    else writeValue(this as never, key, value);
  }

  items(key: string): GroupItem[] {
    return groupItems(this as never, key);
  }
  addItem(key: string): boolean {
    return addItem(this as never, key);
  }
  removeItem(key: string, index: number): boolean {
    return removeItem(this as never, key, index);
  }
  setItemValue(key: string, index: number, field: string, value: unknown): void {
    setItemValue(this as never, key, index, field, value);
  }

  setErrors(errors: Record<string, string>): void {
    applyValidationErrors(this as never, errors, true);
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

  next(): Promise<boolean> {
    return changeStep(this as never, 'next');
  }
  back(): Promise<boolean> {
    return changeStep(this as never, 'back');
  }
  skip(submit?: SubmitHandler): Promise<boolean> {
    return skipStep(this as never, submit);
  }
  submit(handler: SubmitHandler): Promise<boolean> {
    return submitForm(this as never, handler);
  }
  isStepSkipped(stepId: string): boolean {
    return this.skipped.has(stepId);
  }
  validate(): Record<string, string> {
    return validateForm(this as never);
  }
  validateField(key: string): string | null {
    return validateOne(this as never, key);
  }
  getSubmitValues(): Partial<TValues> {
    return getSubmitValues(this as never) as Partial<TValues>;
  }
  goToStepWithField(key: string): void {
    goToStepWithField(this as never, key);
  }
  reset(values?: Record<string, unknown>): void {
    resetEngine(this as never, values);
  }

  private get view() {
    return this.visibility.state(this.state.values, this.currentStepIndex);
  }

  private notify(options: RuntimeNotifyOptions = {}): void {
    this.visibility.markChanged(!!options.structureChanged, !!options.valuesChanged);
    this.subscriptions.notify(options);
  }
}
