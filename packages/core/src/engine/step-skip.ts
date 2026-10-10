import type { FormStep } from '../types';
import { createValues } from './engine-utils';
import type { EngineInternals } from './runtime-internals';
import { activeSteps } from './step-routes';

function resetValues(engine: EngineInternals): Record<string, unknown> {
  const fields = engine.currentStep?.fields ?? [];
  const values = { ...engine.values };
  for (const { key } of fields) delete values[key];
  return Object.assign(values, createValues(fields));
}

export function skipTarget(engine: EngineInternals): FormStep | undefined {
  return activeSteps(engine.definition, resetValues(engine))[engine.currentStepIndex + 1];
}

export function skipCurrentStep(engine: EngineInternals): string[] {
  const step = engine.currentStep!;
  const fieldKeys = step.fields.map(({ key }) => key);
  engine.values = resetValues(engine);
  for (const key of fieldKeys) delete engine.errors[key];
  engine.skipped.set(step.id, fieldKeys);
  engine.visibility.reconcileHidden(engine.values, engine.errors);
  engine.notify({ fieldKeys, structureChanged: true, valuesChanged: true });
  return fieldKeys;
}

export function includeCurrentStep(engine: EngineInternals): void {
  const step = engine.currentStep;
  if (step) engine.skipped.delete(step.id);
}

export function skipStepAt(engine: EngineInternals, index: number): string[] {
  engine.currentStepIndex = index;
  engine.notify({ structureChanged: true });
  return skipCurrentStep(engine);
}
