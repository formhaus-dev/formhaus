import { getAllFields } from './engine-utils';
import { indexConditions } from './visibility-index';
import { ActivePath } from './step-routes';
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
  private routeFields = new Set<string>();
  private readonly path: ActivePath;
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
    this.allFields = getAllFields(definition);
    this.fieldByKey = new Map(this.allFields.map((field) => [field.key, field]));
    this.path = new ActivePath(definition);
    for (const step of definition.steps ?? []) {
      for (const field of step.fields) this.stepByFieldKey.set(field.key, step);
    }
    this.buildIndexes();
  }

  markChanged(structureChanged: boolean, valuesChanged: boolean): void {
    if (structureChanged || valuesChanged) this.path.invalidate();
    if (structureChanged) {
      this.visibilityDirty = true;
      this.canGoNextDirty = true;
    } else if (valuesChanged) {
      this.canGoNextDirty = true;
    }
  }

  state(values: Record<string, unknown>, stepIndex: number): VisibilityCache {
    this.recomputeVisibility(values, stepIndex);
    return this.cache;
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
    const errors = step ? validateStep(step, this.conditionValues(values), validators) : {};
    this.cache.canGoNext = this.isMultiStep && Object.keys(errors).length === 0;
    return this.cache.canGoNext;
  }

  findStepIndex(fieldKey: string, values: Record<string, unknown>, stepIndex: number): number | null {
    const steps = this.state(values, stepIndex).visibleSteps;
    const target = steps.findIndex((step) => step.fields.some((field) => field.key === fieldKey));
    return target === -1 ? null : target;
  }

  affectsStructure(key: string, clearedFields: Set<string>): boolean {
    return this.routeFields.has(key) || this.fieldDependents.has(key) || this.stepDependents.has(key) || clearedFields.size > 0;
  }

  cascadeHiddenFields(
    changedKey: string,
    values: Record<string, unknown>,
    errors: Record<string, string>,
  ): Set<string> {
    this.path.invalidate();
    if (this.hasRoutes) return this.reconcileHidden(values, errors);
    return this.drainQueue(new Set([changedKey]), values, errors);
  }

  reconcileHidden(values: Record<string, unknown>, errors: Record<string, string>): Set<string> {
    this.path.invalidate();
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
    const clear = (key: string) => {
      delete values[key];
      delete errors[key];
      this.path.invalidate();
      cleared.add(key);
      if (queued.has(key)) return;
      queued.add(key);
      queue.push(key);
    };

    for (let index = 0; index < queue.length; index++) {
      const key = queue[index];
      queued.delete(key);
      this.clearHiddenFields(this.fieldDependents.get(key), values, clear);
      this.clearHiddenSteps(this.stepDependents.get(key), values, clear);
    }
    return cleared;
  }

  isFieldVisible(key: string, values: Record<string, unknown>): boolean {
    const field = this.fieldByKey.get(key);
    if (!field || !isVisible(field, this.conditionValues(values))) return false;
    const step = this.stepByFieldKey.get(key);
    return !step || this.path.steps(values).includes(step);
  }

  getVisibleFieldKeys(values: Record<string, unknown>, stepIndex: number): Set<string> {
    if (this.hasRoutes) return new Set(Object.keys(this.path.values(values)));
    const keys = new Set<string>();
    const fields = this.isMultiStep
      ? this.state(values, stepIndex).visibleSteps.flatMap((step) => step.fields)
      : this.definition.fields ?? [];
    for (const field of fields) {
      if (isVisible(field, this.conditionValues(values))) keys.add(field.key);
    }
    return keys;
  }
  private conditionValues(values: Record<string, unknown>) { return this.hasRoutes ? this.path.values(values) : values; }
  private get hasRoutes(): boolean { return this.path.enabled; }
  private get isMultiStep(): boolean { return (this.definition.steps ?? []).length > 0; }
  private buildIndexes(): void {
    for (const field of this.allFields) {
      indexConditions(field, field.show, field.showAny, this.fieldDependents);
    }
    for (const step of this.definition.steps ?? []) {
      indexConditions(step, step.show, step.showAny, this.stepDependents);
      for (const route of step.routes ?? []) {
        for (const condition of [...(route.show ?? []), ...(route.showAny ?? [])]) this.routeFields.add(condition.field);
      }
    }
  }
  private recomputeVisibility(values: Record<string, unknown>, stepIndex: number): void {
    if (!this.visibilityDirty) return;
    this.visibilityDirty = false;
    if (!this.isMultiStep) {
      this.cache.visibleSteps = [];
      this.cache.currentStep = null;
      this.cache.visibleFields = (this.definition.fields ?? []).filter((field) => isVisible(field, this.conditionValues(values)));
      return;
    }
    this.cache.visibleSteps = this.path.steps(values);
    const steps = this.cache.visibleSteps;
    this.cache.currentStep = steps[stepIndex] ?? steps[steps.length - 1] ?? null;
    const current = this.cache.currentStep;
    this.cache.visibleFields = current
      ? current.fields.filter((field) => isVisible(field, this.conditionValues(values)))
      : [];
  }
  private clearHiddenFields(
    fields: Iterable<FormField> | undefined,
    values: Record<string, unknown>,
    clear: (key: string) => void,
  ): void {
    for (const field of fields ?? []) {
      const step = this.stepByFieldKey.get(field.key);
      if (this.hasRoutes && step && !this.path.steps(values).includes(step)) continue;
      if (isVisible(field, this.conditionValues(values)) || values[field.key] === undefined) continue;
      clear(field.key);
    }
  }
  private clearHiddenSteps(
    steps: Iterable<FormStep> | undefined,
    values: Record<string, unknown>,
    clear: (key: string) => void,
  ): void {
    for (const step of steps ?? []) {
      if (isStepVisible(step, this.conditionValues(values))) continue;
      for (const field of step.fields) {
        if (values[field.key] === undefined) continue;
        clear(field.key);
      }
    }
  }
}
