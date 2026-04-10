import { validateDefinition } from '../definition-validation';
import type { FormField, FormDefinition, FormStep } from '../types';
import type { ValidatorFn } from '../validation';
import { validateField, validateFields, validateStep } from '../validation';
import { isStepVisible, isVisible } from '../visibility';

const MAX_CASCADE_ITERATIONS = 50;

export type StepValidateFn = (
  stepId: string,
  values: Record<string, unknown>,
) => Promise<Record<string, string> | null | void>;

export interface FormEngineOptions {
  validators?: Record<string, ValidatorFn>;
  onStepValidate?: StepValidateFn;
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
  private _validators: Record<string, ValidatorFn>;
  private _onStepValidate?: StepValidateFn;
  private _allFields: FormField[];
  private _isDirty: boolean;
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
    this.currentStepIndex = 0;
    this.errors = {};
    this.topLevelErrors = [];
    this.fieldLoading = {};
    this.stepValidating = false;

    this._allFields = this._computeAllFields();
    this._isDirty = true;
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

  // --- Computed getters ---

  get isMultiStep(): boolean {
    return (this.definition.steps ?? []).length > 0;
  }

  get visibleSteps(): FormStep[] {
    this._recomputeIfDirty();
    return this._cache.visibleSteps;
  }

  get currentStep(): FormStep | null {
    this._recomputeIfDirty();
    return this._cache.currentStep;
  }

  get visibleFields(): FormField[] {
    this._recomputeIfDirty();
    return this._cache.visibleFields;
  }

  get isFirstStep(): boolean {
    return this.currentStepIndex === 0;
  }

  get isLastStep(): boolean {
    return this.currentStepIndex >= this.visibleSteps.length - 1;
  }

  get canGoNext(): boolean {
    this._recomputeIfDirty();
    return this._cache.canGoNext;
  }

  get progress(): { current: number; total: number } {
    const total = this.visibleSteps.length;
    return { current: Math.min(this.currentStepIndex + 1, total), total };
  }

  // --- Mutations ---

  setValue(key: string, value: unknown): void {
    this.values[key] = value;

    // Clear error for this field
    delete this.errors[key];

    // Cascade: clear hidden fields, loop until stable
    this._cascadeClearHiddenFields();

    this._notify();
  }

  setErrors(errors: Record<string, string>): void {
    this.errors = {};
    this.topLevelErrors = [];

    for (const [key, message] of Object.entries(errors)) {
      // Check if field is visible
      const field = this._allFields.find((f) => f.key === key);
      if (field && isVisible(field, this.values)) {
        this.errors[key] = message;
      } else {
        // Field is hidden or doesn't exist: surface as top-level error
        this.topLevelErrors.push(message);
      }
    }

    // Navigate to step containing first visible error
    if (this.isMultiStep) {
      const firstErrorKey = Object.keys(errors).find((k) => this.errors[k] !== undefined);
      if (firstErrorKey) {
        this.goToStepWithField(firstErrorKey);
      }
    }

    this._notify();
  }

  setFieldLoading(key: string, loading: boolean): void {
    if (loading) {
      this.fieldLoading[key] = true;
    } else {
      delete this.fieldLoading[key];
    }
    this._notify();
  }

  nextStep(): boolean {
    if (!this.isMultiStep) return false;

    const step = this.currentStep;
    if (!step) return false;

    // Validate current step
    const stepErrors = validateStep(step, this.values, this._validators);
    if (Object.keys(stepErrors).length > 0) {
      Object.assign(this.errors, stepErrors);
      this._notify();
      return false;
    }

    // Move to next visible step
    if (this.isLastStep) return false;

    this.currentStepIndex++;
    this._notify();
    return true;
  }

  async nextStepAsync(): Promise<boolean> {
    if (!this.isMultiStep) return false;
    if (this.stepValidating) return false;

    const step = this.currentStep;
    if (!step) return false;

    const stepErrors = validateStep(step, this.values, this._validators);
    if (Object.keys(stepErrors).length > 0) {
      Object.assign(this.errors, stepErrors);
      this._notify();
      return false;
    }

    if (!this._onStepValidate) {
      if (this.isLastStep) return false;
      this.currentStepIndex++;
      this._notify();
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
        this.errors = {};
        this.topLevelErrors = [];
        for (const [key, message] of Object.entries(result)) {
          const field = this._allFields.find((f) => f.key === key);
          if (field && isVisible(field, this.values)) {
            this.errors[key] = message;
          } else {
            this.topLevelErrors.push(message);
          }
        }
        this.stepValidating = false;
        this._notify();
        return false;
      }

      if (this.isLastStep) {
        this.stepValidating = false;
        this._notify();
        return false;
      }

      this.stepValidating = false;
      this.currentStepIndex++;
      this._notify();
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
    this._notify();
  }

  validate(): Record<string, string> {
    if (this.isMultiStep) {
      const allErrors: Record<string, string> = {};
      for (const step of this.visibleSteps) {
        const stepErrors = validateStep(step, this.values, this._validators);
        Object.assign(allErrors, stepErrors);
      }
      this.errors = allErrors;
      this._notify();
      return allErrors;
    }

    const errors = validateFields(this.definition.fields ?? [], this.values, this._validators);
    this.errors = errors;
    this._notify();
    return errors;
  }

  validateField(key: string): string | null {
    const field = this._allFields.find((f) => f.key === key);
    if (!field) return null;
    if (!isVisible(field, this.values)) return null;

    const error = validateField(field, this.values[key], this.values, this._validators);
    if (error) {
      this.errors[key] = error;
    } else {
      delete this.errors[key];
    }
    this._notify();
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

    const visibleSteps = this.visibleSteps;
    for (let i = 0; i < visibleSteps.length; i++) {
      const hasField = visibleSteps[i].fields.some((f) => f.key === fieldKey);
      if (hasField) {
        this.currentStepIndex = i;
        this._notify();
        return;
      }
    }
    // Field not found in any visible step: no-op
  }

  reset(values?: Record<string, unknown>): void {
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
    this._notify();
  }

  // --- Private ---

  private _computeAllFields(): FormField[] {
    if (this.isMultiStep) {
      const steps = this.definition.steps ?? [];
      return steps.flatMap((s) => s.fields);
    }
    return this.definition.fields ?? [];
  }

  private _cascadeClearHiddenFields(): void {
    const hiddenStepFields = new Set<string>();
    if (this.isMultiStep) {
      for (const step of this.definition.steps ?? []) {
        if (!isStepVisible(step, this.values)) {
          for (const field of step.fields) {
            hiddenStepFields.add(field.key);
          }
        }
      }
    }

    for (let i = 0; i < MAX_CASCADE_ITERATIONS; i++) {
      let changed = false;

      for (const field of this._allFields) {
        const fieldHidden = !isVisible(field, this.values) || hiddenStepFields.has(field.key);
        if (fieldHidden && this.values[field.key] !== undefined) {
          delete this.values[field.key];
          delete this.errors[field.key];
          changed = true;
        }
      }

      if (!changed) break;
    }
  }

  private _recomputeIfDirty(): void {
    if (!this._isDirty) return;
    this._isDirty = false;

    if (!this.isMultiStep) {
      this._cache.visibleSteps = [];
      this._cache.currentStep = null;
      this._cache.visibleFields = (this.definition.fields ?? []).filter((f) => isVisible(f, this.values));
      this._cache.canGoNext = false;
      return;
    }

    const steps = this.definition.steps ?? [];
    this._cache.visibleSteps = steps.filter((s) => isStepVisible(s, this.values));

    const vs = this._cache.visibleSteps;
    this._cache.currentStep = vs[this.currentStepIndex] ?? vs[vs.length - 1] ?? null;

    const step = this._cache.currentStep;
    this._cache.visibleFields = step ? step.fields.filter((f) => isVisible(f, this.values)) : [];

    const stepErrors = step ? validateStep(step, this.values, this._validators) : {};
    this._cache.canGoNext = Object.keys(stepErrors).length === 0;
  }

  private _notify(): void {
    this._isDirty = true;
    this._version++;
    for (const listener of this._listeners) {
      listener();
    }
  }
}
