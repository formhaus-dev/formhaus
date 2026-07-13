import type { ValidatorFn } from '../validation';
import { validateStep } from '../validation';
import type { FormDefinition, FormField, FormStep } from '../types';
import { isStepVisible, isVisible } from '../visibility';

interface VisibilityCache {
  visibleSteps: FormStep[];
  currentStep: FormStep | null;
  visibleFields: FormField[];
  canGoNext: boolean;
}

export class VisibilityState {
  readonly allFields: FormField[];
  readonly fieldByKey: Map<string, FormField>;

  private fieldDependents = new Map<string, Set<FormField>>();
  private stepDependents = new Map<string, Set<FormStep>>();
  private stepByFieldKey = new Map<string, FormStep>();
  private visibilityDirty = true;
  private canGoNextDirty = true;
  private cache: VisibilityCache = {
    visibleSteps: [],
    currentStep: null,
    visibleFields: [],
    canGoNext: false,
  };

  constructor(private definition: FormDefinition) {
    this.allFields = this.computeAllFields();
    this.fieldByKey = new Map(this.allFields.map((field) => [field.key, field]));
    for (const step of definition.steps ?? []) {
      for (const field of step.fields) this.stepByFieldKey.set(field.key, step);
    }
    this.buildIndexes();
  }

  markChanged(structureChanged: boolean, valuesChanged: boolean): void {
    if (structureChanged) {
      this.visibilityDirty = true;
      this.canGoNextDirty = true;
    } else if (valuesChanged) {
      this.canGoNextDirty = true;
    }
  }

  getVisibleSteps(values: Record<string, unknown>, stepIndex: number): FormStep[] {
    this.recomputeVisibility(values, stepIndex);
    return this.cache.visibleSteps;
  }

  getCurrentStep(values: Record<string, unknown>, stepIndex: number): FormStep | null {
    this.recomputeVisibility(values, stepIndex);
    return this.cache.currentStep;
  }

  getVisibleFields(values: Record<string, unknown>, stepIndex: number): FormField[] {
    this.recomputeVisibility(values, stepIndex);
    return this.cache.visibleFields;
  }

  getCanGoNext(
    values: Record<string, unknown>,
    stepIndex: number,
    validators: Record<string, ValidatorFn>,
  ): boolean {
    this.recomputeVisibility(values, stepIndex);
    if (!this.canGoNextDirty) return this.cache.canGoNext;
    this.canGoNextDirty = false;
    const step = this.cache.currentStep;
    const errors = step ? validateStep(step, values, validators) : {};
    this.cache.canGoNext = this.isMultiStep && Object.keys(errors).length === 0;
    return this.cache.canGoNext;
  }

  findStepIndex(fieldKey: string, values: Record<string, unknown>, stepIndex: number): number | null {
    const steps = this.getVisibleSteps(values, stepIndex);
    const target = steps.findIndex((step) => step.fields.some((field) => field.key === fieldKey));
    return target === -1 ? null : target;
  }

  affectsStructure(key: string, clearedFields: Set<string>): boolean {
    return this.fieldDependents.has(key) || this.stepDependents.has(key) || clearedFields.size > 0;
  }

  cascadeHiddenFields(
    changedKey: string,
    values: Record<string, unknown>,
    errors: Record<string, string>,
  ): Set<string> {
    return this.drainQueue(new Set([changedKey]), values, errors);
  }

  reconcileHidden(values: Record<string, unknown>, errors: Record<string, string>): Set<string> {
    const seed = new Set([...this.fieldDependents.keys(), ...this.stepDependents.keys()]);
    return this.drainQueue(seed, values, errors);
  }

  private drainQueue(
    seed: Set<string>,
    values: Record<string, unknown>,
    errors: Record<string, string>,
  ): Set<string> {
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
      this.clearHiddenFields(this.fieldDependents.get(key), values, errors, cleared, enqueue);
      this.clearHiddenSteps(this.stepDependents.get(key), values, errors, cleared, enqueue);
    }
    return cleared;
  }

  isFieldVisible(key: string, values: Record<string, unknown>): boolean {
    const field = this.fieldByKey.get(key);
    if (!field || !isVisible(field, values)) return false;
    const step = this.stepByFieldKey.get(key);
    return !step || isStepVisible(step, values);
  }

  getVisibleFieldKeys(values: Record<string, unknown>, stepIndex: number): Set<string> {
    const keys = new Set<string>();
    const fields = this.isMultiStep
      ? this.getVisibleSteps(values, stepIndex).flatMap((step) => step.fields)
      : this.definition.fields ?? [];
    for (const field of fields) {
      if (isVisible(field, values)) keys.add(field.key);
    }
    return keys;
  }

  private get isMultiStep(): boolean {
    return (this.definition.steps ?? []).length > 0;
  }

  private computeAllFields(): FormField[] {
    return this.isMultiStep
      ? (this.definition.steps ?? []).flatMap((step) => step.fields)
      : this.definition.fields ?? [];
  }

  private buildIndexes(): void {
    for (const field of this.allFields) {
      this.indexConditions(field, field.show, field.showAny, this.fieldDependents);
    }
    for (const step of this.definition.steps ?? []) {
      this.indexConditions(step, step.show, step.showAny, this.stepDependents);
    }
  }

  private indexConditions<T extends FormField | FormStep>(
    dependent: T,
    show: T['show'],
    showAny: T['showAny'],
    index: Map<string, Set<T>>,
  ): void {
    for (const condition of [...(show ?? []), ...(showAny ?? [])]) {
      const dependents = index.get(condition.field) ?? new Set<T>();
      dependents.add(dependent);
      index.set(condition.field, dependents);
    }
  }

  private recomputeVisibility(values: Record<string, unknown>, stepIndex: number): void {
    if (!this.visibilityDirty) return;
    this.visibilityDirty = false;
    if (!this.isMultiStep) {
      this.cache.visibleSteps = [];
      this.cache.currentStep = null;
      this.cache.visibleFields = (this.definition.fields ?? []).filter((field) => isVisible(field, values));
      return;
    }
    this.cache.visibleSteps = (this.definition.steps ?? []).filter((step) => isStepVisible(step, values));
    const steps = this.cache.visibleSteps;
    this.cache.currentStep = steps[stepIndex] ?? steps[steps.length - 1] ?? null;
    const current = this.cache.currentStep;
    this.cache.visibleFields = current
      ? current.fields.filter((field) => isVisible(field, values))
      : [];
  }

  private clearHiddenFields(
    fields: Iterable<FormField> | undefined,
    values: Record<string, unknown>,
    errors: Record<string, string>,
    cleared: Set<string>,
    enqueue: (key: string) => void,
  ): void {
    for (const field of fields ?? []) {
      if (isVisible(field, values) || values[field.key] === undefined) continue;
      delete values[field.key];
      delete errors[field.key];
      cleared.add(field.key);
      enqueue(field.key);
    }
  }

  private clearHiddenSteps(
    steps: Iterable<FormStep> | undefined,
    values: Record<string, unknown>,
    errors: Record<string, string>,
    cleared: Set<string>,
    enqueue: (key: string) => void,
  ): void {
    for (const step of steps ?? []) {
      if (isStepVisible(step, values)) continue;
      for (const field of step.fields) {
        if (values[field.key] === undefined) continue;
        delete values[field.key];
        delete errors[field.key];
        cleared.add(field.key);
        enqueue(field.key);
      }
    }
  }
}
