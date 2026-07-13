import { validateDefinition } from '../definition-validation';
import type { FormField, FormDefinition, FormStep } from '../types';
import type { ValidatorFn } from '../validation';
import { validateField, validateFields, validateStep } from '../validation';
import { isStepVisible, isVisible } from '../visibility';

export type StepValidateFn = (
  stepId: string,
  values: Record<string, unknown>,
) => Promise<Record<string, string> | null | void>;

export interface FormEngineOptions {
  validators?: Record<string, ValidatorFn>;
  onStepValidate?: StepValidateFn;
}

interface NotifyOptions {
  fieldKeys?: Iterable<string>;
  structureChanged?: boolean;
  valuesChanged?: boolean;
}

export class FormEngine {
  readonly definition: FormDefinition;

  values: Record<string, unknown>;
  errors: Record<string, string>;
  topLevelErrors: string[];
  currentStepIndex: number;
  fieldLoading: Record<string, boolean>;
  stepValidating: boolean;

  private _version: number;
  private _listeners: Set<() => void>;
  private _fieldVersions: Map<string, number>;
  private _fieldListeners: Map<string, Set<() => void>>;
  private _structureVersion: number;
  private _structureListeners: Set<() => void>;
  private _validators: Record<string, ValidatorFn>;
  private _onStepValidate?: StepValidateFn;
  private _allFields: FormField[];
  private _fieldByKey: Map<string, FormField>;
  private _fieldDependents: Map<string, Set<FormField>>;
  private _stepDependents: Map<string, Set<FormStep>>;
  private _isVisibilityDirty: boolean;
  private _isCanGoNextDirty: boolean;
  private _cache: {
    visibleSteps: FormStep[];
    currentStep: FormStep | null;
    visibleFields: FormField[];
    canGoNext: boolean;
  };

  constructor(
    definition: FormDefinition,
    initialValues?: Record<string, unknown>,
    options?: FormEngineOptions,
  ) {
    const hasFields = (definition.fields?.length ?? 0) > 0;
    const hasSteps = (definition.steps?.length ?? 0) > 0;
    if (hasFields && hasSteps) {
      throw new Error('FormDefinition cannot have both "fields" and "steps" as non-empty arrays.');
    }

    const warnings = validateDefinition(definition);
    if (warnings.length > 0) {
      for (const w of warnings) {
        console.warn(`[FormEngine] ${w}`);
      }
    }

    this.definition = definition;
    this._validators = options?.validators ?? {};
    this._onStepValidate = options?.onStepValidate;
    this._version = 0;
    this._listeners = new Set();
    this._fieldVersions = new Map();
    this._fieldListeners = new Map();
    this._structureVersion = 0;
    this._structureListeners = new Set();
    this.currentStepIndex = 0;
    this.errors = {};
    this.topLevelErrors = [];
    this.fieldLoading = {};
    this.stepValidating = false;

    this._allFields = this._computeAllFields();
    this._fieldByKey = new Map(this._allFields.map((field) => [field.key, field]));
    this._fieldDependents = new Map();
    this._stepDependents = new Map();
    this._buildVisibilityIndexes();
    this._isVisibilityDirty = true;
    this._isCanGoNextDirty = true;
    this._cache = { visibleSteps: [], currentStep: null, visibleFields: [], canGoNext: false };

    // Initialize values with defaults, then overlay initialValues
    this.values = {};
    for (const field of this._allFields) {
      if (field.defaultValue !== undefined) {
        this.values[field.key] = field.defaultValue;
      }
    }
    if (initialValues) {
      Object.assign(this.values, initialValues);
    }
    this._reconcileHiddenFields();
  }

  // --- React integration ---

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  getSnapshot(): number {
    return this._version;
  }

  subscribeField(key: string, listener: () => void): () => void {
    const listeners = this._fieldListeners.get(key) ?? new Set();
    listeners.add(listener);
    this._fieldListeners.set(key, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this._fieldListeners.delete(key);
      }
    };
  }

  getFieldSnapshot(key: string): number {
    return this._fieldVersions.get(key) ?? 0;
  }

  subscribeStructure(listener: () => void): () => void {
    this._structureListeners.add(listener);
    return () => {
      this._structureListeners.delete(listener);
    };
  }

  getStructureSnapshot(): number {
    return this._structureVersion;
  }

  // --- Computed getters ---

  get isMultiStep(): boolean {
    return (this.definition.steps ?? []).length > 0;
  }

  get visibleSteps(): FormStep[] {
    this._recomputeVisibilityIfDirty();
    return this._cache.visibleSteps;
  }

  get currentStep(): FormStep | null {
    this._recomputeVisibilityIfDirty();
    return this._cache.currentStep;
  }

  get visibleFields(): FormField[] {
    this._recomputeVisibilityIfDirty();
    return this._cache.visibleFields;
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex >= this.visibleSteps.length - 1;
  }

  get canGoNext(): boolean {
    this._recomputeCanGoNextIfDirty();
    return this._cache.canGoNext;
  }

  get progress(): { current: number; total: number } {
    const total = this.visibleSteps.length;
    return { current: Math.min(this.currentStepIndex + 1, total), total };
  }

  // --- Mutations ---

  setValue(key: string, value: unknown): void {
    const valueChanged = !Object.is(this.values[key], value);
    const hadError = this.errors[key] !== undefined;
    this.values[key] = value;

    // Clear error for this field
    delete this.errors[key];

    // Cascade: clear hidden fields, loop until stable
    const clearedFields = this._cascadeClearHiddenFields(key);
    const changedFields = new Set(clearedFields);
    if (valueChanged || hadError) {
      changedFields.add(key);
    }
    const valuesChanged = valueChanged || clearedFields.size > 0;
    const structureChanged = valuesChanged && (
      this._fieldDependents.has(key) ||
      this._stepDependents.has(key) ||
      clearedFields.size > 0
    );

    this._notify({ fieldKeys: changedFields, structureChanged, valuesChanged });
  }

  setErrors(errors: Record<string, string>): void {
    const previousErrors = this.errors;
    this.errors = {};
    this.topLevelErrors = [];

    for (const [key, message] of Object.entries(errors)) {
      // Check if field is visible
      const field = this._fieldByKey.get(key);
      if (field && isVisible(field, this.values)) {
        this.errors[key] = message;
      } else {
        // Field is hidden or doesn't exist: surface as top-level error
        this.topLevelErrors.push(message);
      }
    }

    // Navigate to step containing first visible error
    let structureChanged = false;
    if (this.isMultiStep) {
      const firstErrorKey = Object.keys(errors).find((k) => this.errors[k] !== undefined);
      if (firstErrorKey) {
        const targetIndex = this._findVisibleStepIndexWithField(firstErrorKey);
        if (targetIndex !== null) {
          structureChanged = targetIndex !== this.currentStepIndex;
          this.currentStepIndex = targetIndex;
        }
      }
    }

    this._notify({
      fieldKeys: this._getChangedKeys(previousErrors, this.errors),
      structureChanged,
    });
  }

  setFieldLoading(key: string, loading: boolean): void {
    const previous = this.fieldLoading[key] === true;
    if (loading) {
      this.fieldLoading[key] = true;
    } else {
      delete this.fieldLoading[key];
    }
    this._notify({ fieldKeys: previous === loading ? [] : [key] });
  }

  nextStep(): boolean {
    if (!this.isMultiStep) return false;

    const step = this.currentStep;
    if (!step) return false;

    // Validate current step
    const stepErrors = validateStep(step, this.values, this._validators);
    if (Object.keys(stepErrors).length > 0) {
      const previousErrors = { ...this.errors };
      Object.assign(this.errors, stepErrors);
      this._notify({ fieldKeys: this._getChangedKeys(previousErrors, this.errors) });
      return false;
    }

    // Move to next visible step
    if (this.isLastStep) return false;

    this.currentStepIndex++;
    this._notify({ structureChanged: true });
    return true;
  }

  async nextStepAsync(): Promise<boolean> {
    if (!this.isMultiStep) return false;
    if (this.stepValidating) return false;

    const step = this.currentStep;
    if (!step) return false;

    const stepErrors = validateStep(step, this.values, this._validators);
    if (Object.keys(stepErrors).length > 0) {
      const previousErrors = { ...this.errors };
      Object.assign(this.errors, stepErrors);
      this._notify({ fieldKeys: this._getChangedKeys(previousErrors, this.errors) });
      return false;
    }

    if (!this._onStepValidate) {
      if (this.isLastStep) return false;
      this.currentStepIndex++;
      this._notify({ structureChanged: true });
      return true;
    }

    const stepIndexBefore = this.currentStepIndex;
    this.stepValidating = true;
    this._notify();

    try {
      const result = await this._onStepValidate(step.id, this.values);

      if (this.currentStepIndex !== stepIndexBefore) {
        this.stepValidating = false;
        this._notify();
        return false;
      }

      if (result && Object.keys(result).length > 0) {
        const previousErrors = this.errors;
        this.errors = {};
        this.topLevelErrors = [];
        for (const [key, message] of Object.entries(result)) {
          const field = this._fieldByKey.get(key);
          if (field && isVisible(field, this.values)) {
            this.errors[key] = message;
          } else {
            this.topLevelErrors.push(message);
          }
        }
        this.stepValidating = false;
        this._notify({ fieldKeys: this._getChangedKeys(previousErrors, this.errors) });
        return false;
      }

      if (this.isLastStep) {
        this.stepValidating = false;
        this._notify();
        return false;
      }

      this.stepValidating = false;
      this.currentStepIndex++;
      this._notify({ structureChanged: true });
      return true;
    } catch (e) {
      this.stepValidating = false;
      this._notify();
      throw e;
    }
  }

  prevStep(): void {
    if (!this.isMultiStep) return;
    if (this.isFirstStep) return;

    this.currentStepIndex--;
    this._notify({ structureChanged: true });
  }

  validate(): Record<string, string> {
    const previousErrors = this.errors;
    if (this.isMultiStep) {
      const allErrors: Record<string, string> = {};
      for (const step of this.visibleSteps) {
        const stepErrors = validateStep(step, this.values, this._validators);
        Object.assign(allErrors, stepErrors);
      }
      this.errors = allErrors;
      this._notify({ fieldKeys: this._getChangedKeys(previousErrors, this.errors) });
      return allErrors;
    }

    const errors = validateFields(this.definition.fields ?? [], this.values, this._validators);
    this.errors = errors;
    this._notify({ fieldKeys: this._getChangedKeys(previousErrors, this.errors) });
    return errors;
  }

  validateField(key: string): string | null {
    const field = this._fieldByKey.get(key);
    if (!field) return null;
    if (!isVisible(field, this.values)) return null;

    const previousError = this.errors[key];
    const error = validateField(field, this.values[key], this.values, this._validators);
    if (error) {
      this.errors[key] = error;
    } else {
      delete this.errors[key];
    }
    this._notify({ fieldKeys: Object.is(previousError, this.errors[key]) ? [] : [key] });
    return error;
  }

  getSubmitValues(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const visibleKeys = new Set<string>();

    if (this.isMultiStep) {
      for (const step of this.visibleSteps) {
        for (const field of step.fields) {
          if (isVisible(field, this.values)) {
            visibleKeys.add(field.key);
          }
        }
      }
    } else {
      for (const field of this.definition.fields ?? []) {
        if (isVisible(field, this.values)) {
          visibleKeys.add(field.key);
        }
      }
    }

    for (const key of visibleKeys) {
      if (this.values[key] !== undefined) {
        result[key] = this.values[key];
      }
    }

    return result;
  }

  goToStepWithField(fieldKey: string): void {
    if (!this.isMultiStep) return;

    const targetIndex = this._findVisibleStepIndexWithField(fieldKey);
    if (targetIndex === null) return;

    const structureChanged = targetIndex !== this.currentStepIndex;
    this.currentStepIndex = targetIndex;
    this._notify({ structureChanged });
  }

  reset(values?: Record<string, unknown>): void {
    const previousValues = this.values;
    const previousErrors = this.errors;
    this.values = {};
    for (const field of this._allFields) {
      if (field.defaultValue !== undefined) {
        this.values[field.key] = field.defaultValue;
      }
    }
    if (values) {
      Object.assign(this.values, values);
    }
    this.errors = {};
    this.topLevelErrors = [];
    this.currentStepIndex = 0;
    this._reconcileHiddenFields();
    const changedValues = this._getChangedKeys(previousValues, this.values);
    const changedFields = new Set([
      ...changedValues,
      ...this._getChangedKeys(previousErrors, this.errors),
    ]);
    this._notify({
      fieldKeys: changedFields,
      structureChanged: true,
      valuesChanged: changedValues.size > 0,
    });
  }

  // --- Private ---

  private _computeAllFields(): FormField[] {
    if (this.isMultiStep) {
      const steps = this.definition.steps ?? [];
      return steps.flatMap((s) => s.fields);
    }
    return this.definition.fields ?? [];
  }

  private _buildVisibilityIndexes(): void {
    for (const field of this._allFields) {
      const dependencies = [...(field.show ?? []), ...(field.showAny ?? [])];
      for (const condition of dependencies) {
        const dependents = this._fieldDependents.get(condition.field) ?? new Set<FormField>();
        dependents.add(field);
        this._fieldDependents.set(condition.field, dependents);
      }
    }

    for (const step of this.definition.steps ?? []) {
      const dependencies = [...(step.show ?? []), ...(step.showAny ?? [])];
      for (const condition of dependencies) {
        const dependents = this._stepDependents.get(condition.field) ?? new Set<FormStep>();
        dependents.add(step);
        this._stepDependents.set(condition.field, dependents);
      }
    }
  }

  private _findVisibleStepIndexWithField(fieldKey: string): number | null {
    const visibleSteps = this.visibleSteps;
    for (let index = 0; index < visibleSteps.length; index++) {
      if (visibleSteps[index].fields.some((field) => field.key === fieldKey)) {
        return index;
      }
    }
    return null;
  }

  private _cascadeClearHiddenFields(changedKey: string): Set<string> {
    return this._drainVisibilityQueue(new Set([changedKey]));
  }

  private _reconcileHiddenFields(): Set<string> {
    const seed = new Set([...this._fieldDependents.keys(), ...this._stepDependents.keys()]);
    return this._drainVisibilityQueue(seed);
  }

  private _drainVisibilityQueue(seed: Set<string>): Set<string> {
    const queue = [...seed];
    const queued = new Set(queue);
    const cleared = new Set<string>();

    const enqueue = (key: string) => {
      if (queued.has(key)) return;
      queued.add(key);
      queue.push(key);
    };

    for (let index = 0; index < queue.length; index++) {
      const key = queue[index];
      queued.delete(key);

      for (const field of this._fieldDependents.get(key) ?? []) {
        if (!isVisible(field, this.values) && this.values[field.key] !== undefined) {
          delete this.values[field.key];
          delete this.errors[field.key];
          cleared.add(field.key);
          enqueue(field.key);
        }
      }

      for (const step of this._stepDependents.get(key) ?? []) {
        if (isStepVisible(step, this.values)) continue;

        for (const field of step.fields) {
          if (this.values[field.key] === undefined) continue;
          delete this.values[field.key];
          delete this.errors[field.key];
          cleared.add(field.key);
          enqueue(field.key);
        }
      }
    }

    return cleared;
  }

  private _getChangedKeys(
    previous: Record<string, unknown>,
    next: Record<string, unknown>,
  ): Set<string> {
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
    return new Set([...keys].filter((key) => !Object.is(previous[key], next[key])));
  }

  private _recomputeVisibilityIfDirty(): void {
    if (!this._isVisibilityDirty) return;
    this._isVisibilityDirty = false;

    if (!this.isMultiStep) {
      this._cache.visibleSteps = [];
      this._cache.currentStep = null;
      this._cache.visibleFields = (this.definition.fields ?? []).filter((f) => isVisible(f, this.values));
      return;
    }

    const steps = this.definition.steps ?? [];
    this._cache.visibleSteps = steps.filter((s) => isStepVisible(s, this.values));

    const vs = this._cache.visibleSteps;
    this._cache.currentStep = vs[this.currentStepIndex] ?? vs[vs.length - 1] ?? null;

    const step = this._cache.currentStep;
    this._cache.visibleFields = step ? step.fields.filter((f) => isVisible(f, this.values)) : [];
  }

  private _recomputeCanGoNextIfDirty(): void {
    this._recomputeVisibilityIfDirty();
    if (!this._isCanGoNextDirty) return;
    this._isCanGoNextDirty = false;

    if (!this.isMultiStep) {
      this._cache.canGoNext = false;
      return;
    }

    const step = this._cache.currentStep;
    const stepErrors = step ? validateStep(step, this.values, this._validators) : {};
    this._cache.canGoNext = Object.keys(stepErrors).length === 0;
  }

  private _notify({
    fieldKeys = [],
    structureChanged = false,
    valuesChanged = false,
  }: NotifyOptions = {}): void {
    if (structureChanged) {
      this._isVisibilityDirty = true;
      this._isCanGoNextDirty = true;
    } else if (valuesChanged) {
      this._isCanGoNextDirty = true;
    }

    for (const key of new Set(fieldKeys)) {
      this._fieldVersions.set(key, (this._fieldVersions.get(key) ?? 0) + 1);
      for (const listener of this._fieldListeners.get(key) ?? []) {
        listener();
      }
    }

    if (structureChanged) {
      this._structureVersion++;
      for (const listener of this._structureListeners) {
        listener();
      }
    }

    this._version++;
    for (const listener of this._listeners) {
      listener();
    }
  }
}
