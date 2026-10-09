import type { FormDefinition, FormStep } from '../types';
import { isStepVisible, isVisible } from '../visibility';
import { conditionFields, hasFieldsAndSteps, hasRoutes } from './engine-utils';

export function definitionErrors(definition: FormDefinition): string[] {
  const steps = definition.steps ?? [];
  const warnings = hasFieldsAndSteps(definition) ? ['FormEngine rejects a definition with both "fields" and "steps".'] : [];
  const stepIndexes = new Map<string, number>();
  const fieldIndexes = new Map<string, number>();
  steps.forEach((step, index) => {
    if (stepIndexes.has(step.id)) warnings.push(`Duplicate step id "${step.id}".`);
    stepIndexes.set(step.id, index);
    for (const field of step.fields) fieldIndexes.set(field.key, index);
  });
  if (!hasRoutes(definition)) return warnings;
  steps.forEach((step, index) => {
    for (const route of step.routes ?? []) {
      const target = route.to === null ? null : stepIndexes.get(route.to);
      if (target === undefined || (target !== null && target <= index)) {
        warnings.push(`Invalid route from "${step.id}" to "${route.to}": targets must be later steps or null.`);
      }
      for (const field of conditionFields(route)) {
        if (!((fieldIndexes.get(field) ?? Infinity) <= index)) {
          warnings.push(`Invalid route on "${step.id}": condition field "${field}" must belong to this or an earlier step.`);
        }
      }
    }
  });
  return warnings;
}

export function routeFallthroughWarnings(definition: FormDefinition): string[] {
  const steps = definition.steps ?? [];
  const warnings: string[] = [];
  for (const step of steps) {
    const targets = new Set((step.routes ?? []).map((route) => route.to).filter((to) => to !== null));
    for (const target of targets) {
      const index = steps.findIndex((candidate) => candidate.id === target);
      const sibling = steps[index + 1];
      const exits = steps[index]?.routes?.some((route) => !route.show?.length && !route.showAny?.length);
      if (sibling && targets.has(sibling.id) && !exits) {
        warnings.push(`Route branch "${target}" from "${step.id}" continues into sibling branch "${sibling.id}". Add an unconditional route where it should continue.`);
      }
    }
  }
  return warnings;
}

export function activeSteps(definition: FormDefinition, values: Record<string, unknown>): FormStep[] {
  const steps = definition.steps ?? [];
  if (!hasRoutes(definition)) return steps.filter((step) => isStepVisible(step, values));
  const indexes = new Map(steps.map((step, index) => [step.id, index]));
  const result: FormStep[] = [];
  const available: Record<string, unknown> = {};
  for (let index = 0; index < steps.length;) {
    const step = steps[index];
    if (!isStepVisible(step, available)) { index++; continue; }
    result.push(step);
    Object.assign(available, stepValues(step, values, available));
    const route = step.routes?.find((route) => (
      isVisible(route, available) && (route.to === null || ((indexes.get(route.to) ?? -1) > index
        && isStepVisible(steps[indexes.get(route.to)!], available)))
    ));
    if (route?.to === null) break;
    index = route ? indexes.get(route.to)! : index + 1;
  }
  return result;
}

export function reconcileStepIndex(previous: FormStep[], next: FormStep[], index: number): number {
  const previousStep = previous[index] ?? previous[previous.length - 1];
  const preserved = next.findIndex((step) => step.id === previousStep?.id);
  if (preserved !== -1) return preserved;
  const nextIds = new Map(next.map((step, index) => [step.id, index]));
  for (let before = Math.min(index - 1, previous.length - 1); before >= 0; before--) {
    const predecessor = nextIds.get(previous[before].id);
    if (predecessor !== undefined) return predecessor;
  }
  return 0;
}

function stepValues(step: FormStep, values: Record<string, unknown>, previous: Record<string, unknown>) {
  const candidates = { ...previous };
  for (const field of step.fields) candidates[field.key] = values[field.key];
  const result: Record<string, unknown> = {};
  for (const field of step.fields) {
    if (isVisible(field, candidates) && values[field.key] !== undefined) result[field.key] = values[field.key];
  }
  return result;
}

export class ActivePath {
  readonly enabled: boolean;
  private source: Record<string, unknown> | null = null;
  private activeStepList: FormStep[] = [];
  private activeValueMap: Record<string, unknown> = {};

  constructor(private definition: FormDefinition) {
    this.enabled = hasRoutes(definition);
  }

  invalidate(): void { this.source = null; }

  steps(values: Record<string, unknown>): FormStep[] {
    this.refresh(values);
    return this.activeStepList;
  }

  values(values: Record<string, unknown>): Record<string, unknown> {
    this.refresh(values);
    return this.activeValueMap;
  }

  private refresh(values: Record<string, unknown>): void {
    if (this.source === values) return;
    this.source = values;
    this.activeStepList = activeSteps(this.definition, values);
    const result: Record<string, unknown> = {};
    for (const step of this.activeStepList) Object.assign(result, stepValues(step, values, result));
    this.activeValueMap = result;
  }
}
