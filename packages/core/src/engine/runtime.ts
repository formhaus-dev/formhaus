import type { ValidatorFn } from '../validation';
import type { ResolveMessage } from '../validation/default-messages';
import type { FieldOption, FormDefinition, FormField, FormNode, FormStep } from '../types';
import type { FormEngineOptions, GoToStepResult, SubmitHandler } from './engine-options';
import { initialState } from './engine-utils';
import { reportErrors, startEvents, trackChanges } from './form-events';
import { addItem, groupItems, removeItem, setItemValue, type GroupItem } from './groups';
import { changeStep, goToStep, goToStepWithField, skipStep } from './navigation';
import type { EngineState } from './runtime-internals';
import { createSubscriptions, type NotifyOptions } from './subscriptions';
import { applyValidationErrors, errorKeys, getSubmitValues, resetEngine, validateForm, validateOne } from './validation-state';
import { submitForm } from './submission';
import { loadDefinition, replaceDefinition } from './replace-definition';
import { writeValue } from './write-value';
import { exclusiveWrite } from './exclusive';
import { orderOptions } from './option-target';
import type { VisibilityState } from './visibility-state';

export class FormEngine<TValues extends object = Record<string, unknown>> {
  private readonly state: EngineState;
  private readonly skipped = new Map<string, string[]>();
  private validationEpoch = 0;
  private operationEpoch = 0;
  private latestOperation = 0;
  private sending?: number;
  private viewedStep?: string | null;
  private readonly lifecycle: FormEngineOptions;
  readonly seed: string;

  private readonly validators: Record<string, ValidatorFn>;
  private messages!: ResolveMessage;
  private visibility!: VisibilityState;
  private readonly subscriptions = createSubscriptions();
  private snapshot?: Readonly<Partial<TValues>>;

  constructor(
    readonly definition: FormDefinition,
    initialValues?: Partial<NoInfer<TValues>>,
    options?: FormEngineOptions,
  ) {
    this.lifecycle = options ?? {};
    this.seed = options?.seed || options?.research?.seed() || '';
    this.validators = options?.validators ?? {};
    this.state = initialState({});
    loadDefinition(this as never, definition, () => initialValues as Record<string, unknown> | undefined);
  }

  get values(): Readonly<Partial<TValues>> {
    return (this.lifecycle.hiddenValues === 'keep' ? this.getValuesSnapshot() : this.state.values) as Partial<TValues>;
  }
  get errors(): Readonly<Record<string, string>> {
    return this.state.errors;
  }
  get topLevelErrors(): readonly string[] {
    const { errors, topLevelErrors, values } = this.state;
    if (Object.keys(errors).length === 0) return [...topLevelErrors];
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
    return !!this.definition.steps?.length;
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

  subscribeValues(listener: () => void): () => void {
    return this.subscriptions.subscribeValues(listener);
  }

  getValuesSnapshot(): Readonly<Partial<TValues>> {
    return (this.snapshot ??= Object.freeze({ ...this.visibility.withKept(this.state.values) }) as Partial<TValues>);
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
    if (path) setItemValue(this as never, ...path, value);
    else writeValue(this as never, key, exclusiveWrite(this.visibility.fieldOf(key, this.state.values), this.state.values[key], value));
  }

  orderOptions(key: string, options?: FieldOption[]): FieldOption[] {
    return orderOptions(this as never, key, options);
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

  start(): void {
    startEvents(this as never);
  }

  next(): Promise<boolean> {
    return this.advance('next');
  }
  back(): Promise<boolean> {
    return changeStep(this as never, 'back');
  }
  skip(submit?: SubmitHandler): Promise<boolean> {
    return reportErrors(this as never, () => skipStep(this as never, submit));
  }
  submit(handler: SubmitHandler): Promise<boolean> {
    return reportErrors(this as never, () => submitForm(this as never, handler));
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
    return getSubmitValues(this as never, true) as Partial<TValues>;
  }
  goToStepWithField(key: string): void {
    goToStepWithField(this as never, key);
  }
  goToStep(stepId: string): GoToStepResult {
    return goToStep(this as never, stepId);
  }
  reset(values?: Record<string, unknown>): void {
    resetEngine(this as never, values);
  }
  replaceDefinition(definition: FormDefinition): void {
    replaceDefinition(this as never, definition);
  }

  private advance(reason: 'next' | 'autoAdvance'): Promise<boolean> {
    return reportErrors(this as never, () => changeStep(this as never, 'next', reason));
  }

  private get view() {
    return this.visibility.state(this.state.values, this.currentStepIndex);
  }

  private notify(options: NotifyOptions = {}): void {
    if (options.valuesChanged) this.snapshot = undefined;
    this.visibility.markChanged(!!options.structureChanged, !!options.valuesChanged);
    this.subscriptions.notify(options);
    trackChanges(this as never, options.valuesChanged);
  }
}
