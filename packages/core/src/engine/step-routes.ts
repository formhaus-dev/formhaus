import type { FormDefinition, FormField, FormStep } from '../types';
import { isVisible } from '../visibility';

export function activeSteps(definition: FormDefinition, values: Record<string, unknown>): FormStep[] {
  const steps = definition.steps ?? [];
  const indexes = new Map(steps.map((step, index) => [step.id, index]));
  const result: FormStep[] = [];
  const available: Record<string, unknown> = {};
  for (let index = 0; index < steps.length;) {
    const step = steps[index];
    if (!isVisible(step, available)) { index++; continue; }
    result.push(step);
    Object.assign(available, stepValues(step, values, available));
    const route = step.routes?.find((route) => (
      isVisible(route, available) && (route.to === null || ((indexes.get(route.to) ?? -1) > index
        && isVisible(steps[indexes.get(route.to)!], available)))
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

function stepValues(step: { fields: FormField[] }, values: Record<string, unknown>, previous: Record<string, unknown>) {
  const candidates = { ...previous };
  for (const field of step.fields) candidates[field.key] = values[field.key];
  const result: Record<string, unknown> = {};
  for (const field of step.fields) {
    if (isVisible(field, candidates) && values[field.key] !== undefined) result[field.key] = values[field.key];
  }
  return result;
}

export function createActivePath(definition: FormDefinition) {
  let source: Record<string, unknown> | null = null;
  let steps: FormStep[] = [];
  let active: Record<string, unknown> = {};
  const refresh = (values: Record<string, unknown>) => {
    if (source === values) return;
    source = values;
    steps = activeSteps(definition, values);
    const result: Record<string, unknown> = {};
    const groups = definition.steps?.length ? steps : [{ fields: definition.fields ?? [] }];
    for (const step of groups) Object.assign(result, stepValues(step, values, result));
    active = result;
  };
  return {
    invalidate(): void { source = null; },
    steps(values: Record<string, unknown>): FormStep[] { refresh(values); return steps; },
    values(values: Record<string, unknown>): Record<string, unknown> { refresh(values); return active; },
  };
}
