import { conditionFields, getAllFields } from './engine-utils';
import { indexConditions } from './visibility-index';
import { createActivePath } from './step-routes';
import type { ValidatorFn } from '../validation';
import { validateStep } from '../validation';
import type { FormDefinition, FormField, FormStep } from '../types';
import { isVisible } from '../visibility';

interface VisibilityCache {
  visibleSteps: FormStep[];
  currentStep: FormStep | null;
  visibleFields: FormField[];
  canGoNext: boolean;
}

type Values = Record<string, unknown>;

export type VisibilityState = ReturnType<typeof createVisibility>;

export function createVisibility(definition: FormDefinition) {
  const allFields = getAllFields(definition);
  const fieldsByKey = new Map<string, FormField[]>();
  const routeFields = new Set<string>();
  const path = createActivePath(definition);
  const fieldDependents = new Map<string, Set<FormField>>();
  const stepDependents = new Map<string, Set<FormStep>>();
  const stepOfField = new Map<FormField, FormStep>();
  let visibilityDirty = true;
  let canGoNextDirty = true;
  const cache: VisibilityCache = { visibleSteps: [], currentStep: null, visibleFields: [], canGoNext: false };

  for (const field of allFields) {
    fieldsByKey.set(field.key, [...(fieldsByKey.get(field.key) ?? []), field]);
    indexConditions(field, fieldDependents);
  }
  for (const step of definition.steps ?? []) {
    for (const field of step.fields) stepOfField.set(field, step);
    indexConditions(step, stepDependents);
    for (const route of step.routes ?? []) for (const key of conditionFields(route)) routeFields.add(key);
  }

  const isMultiStep = () => (definition.steps ?? []).length > 0;
  const visible = (source: FormField | FormStep, values: Values) => isVisible(source, path.values(values));
  const onPath = (field: FormField, values: Values) => {
    const step = stepOfField.get(field);
    return !step || path.steps(values).includes(step);
  };

  function state(values: Values, stepIndex: number): VisibilityCache {
    if (!visibilityDirty) return cache;
    visibilityDirty = false;
    if (!isMultiStep()) {
      cache.visibleSteps = [];
      cache.currentStep = null;
      cache.visibleFields = (definition.fields ?? []).filter((field) => visible(field, values));
      return cache;
    }
    const steps = cache.visibleSteps = path.steps(values);
    const current = cache.currentStep = steps[stepIndex] ?? steps[steps.length - 1] ?? null;
    cache.visibleFields = current ? current.fields.filter((field) => visible(field, values)) : [];
    return cache;
  }

  return {
    allFields,
    conditionValues: path.values,
    state,

    markChanged(structureChanged: boolean, valuesChanged: boolean): void {
      if (structureChanged || valuesChanged) path.invalidate();
      if (structureChanged) visibilityDirty = true;
      if (structureChanged || valuesChanged) canGoNextDirty = true;
    },

    getCanGoNext(values: Values, stepIndex: number, validators: Record<string, ValidatorFn>): boolean {
      const step = state(values, stepIndex).currentStep;
      if (!canGoNextDirty) return cache.canGoNext;
      canGoNextDirty = false;
      const errors = step ? validateStep(step, path.values(values), validators) : {};
      return cache.canGoNext = isMultiStep() && Object.keys(errors).length === 0;
    },

    findStepIndex(fieldKey: string, values: Values, stepIndex: number): number | null {
      const target = state(values, stepIndex).visibleSteps.findIndex((step) => step.fields.some((field) => field.key === fieldKey));
      return target === -1 ? null : target;
    },

    affectsStructure(key: string, clearedFields: Set<string>): boolean {
      return routeFields.has(key) || fieldDependents.has(key) || stepDependents.has(key) || clearedFields.size > 0;
    },

    activeField(key: string, values: Values): FormField | undefined {
      return fieldsByKey.get(key)?.find((field) => onPath(field, values) && visible(field, values));
    },

    reconcileHidden(values: Values, errors: Record<string, string>): Set<string> {
      path.invalidate();
      const queue = [...new Set([...fieldDependents.keys(), ...stepDependents.keys()])];
      const queued = new Set(queue);
      const cleared = new Set<string>();
      const held = (key: string) => values[key] !== undefined || errors[key] !== undefined;
      const clear = (key: string) => {
        delete values[key];
        delete errors[key];
        path.invalidate();
        cleared.add(key);
        if (queued.has(key)) return;
        queued.add(key);
        queue.push(key);
      };
      for (let index = 0; index < queue.length; index++) {
        const key = queue[index];
        queued.delete(key);
        for (const field of fieldDependents.get(key) ?? []) {
          if (onPath(field, values) && !visible(field, values) && held(field.key)) clear(field.key);
        }
        for (const step of stepDependents.get(key) ?? []) {
          if (!visible(step, values)) for (const field of step.fields) if (held(field.key)) clear(field.key);
        }
      }
      return cleared;
    },
  };
}
