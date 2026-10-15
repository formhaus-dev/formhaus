import type { FormDefinition, FormField, FormStep } from '../types';
import { isVisible } from '../visibility';
import { trimValue } from '../validation/type-checks';

export function activeSteps(definition: FormDefinition, values: Record<string, unknown>): FormStep[] {
  return walkPath(definition, values).steps;
}

function walkPath(definition: FormDefinition, values: Record<string, unknown>) {
  const steps = definition.steps ?? [];
  const indexes = new Map(steps.map((step, index) => [step.id, index]));
  const result: FormStep[] = [];
  const available: Record<string, unknown> = {};
  if (!steps.length) addStepValues({ fields: definition.fields ?? [] }, values, available);
  for (let index = 0; index < steps.length;) {
    const step = steps[index];
    if (!isVisible(step, available)) { index++; continue; }
    result.push(step);
    addStepValues(step, values, available);
    const route = step.routes?.find((route) => (
      isVisible(route, available) && (route.to === null || ((indexes.get(route.to) ?? -1) > index
        && isVisible(steps[indexes.get(route.to)!], available)))
    ));
    if (route?.to === null) break;
    index = route ? indexes.get(route.to)! : index + 1;
  }
  return { steps: result, values: available };
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

function addStepValues(step: { fields: FormField[] }, values: Record<string, unknown>, target: Record<string, unknown>): void {
  const saved = step.fields.map(({ key }) => [key, Object.prototype.hasOwnProperty.call(target, key), target[key]] as const);
  for (const field of step.fields) target[field.key] = trimValue(field, values[field.key]);
  const shown = step.fields.filter((field) => isVisible(field, target) && values[field.key] !== undefined);
  for (const [key, had, value] of saved) {
    if (had) target[key] = value;
    else delete target[key];
  }
  for (const field of shown) target[field.key] = trimValue(field, values[field.key]);
}

export function createActivePath(definition: FormDefinition) {
  let source: Record<string, unknown> | null = null;
  let steps: FormStep[] = [];
  let active: Record<string, unknown> = {};
  const refresh = (values: Record<string, unknown>) => {
    if (source === values) return;
    source = values;
    ({ steps, values: active } = walkPath(definition, values));
  };
  return {
    invalidate(): void { source = null; },
    steps(values: Record<string, unknown>): FormStep[] { refresh(values); return steps; },
    values(values: Record<string, unknown>): Record<string, unknown> { refresh(values); return active; },
  };
}
