import type { FormStep } from '../types';
import { valueFields } from '../visibility/nodes';
import { createValues } from './engine-utils';
import { baselineFields } from './form-events';
import type { EngineInternals } from './runtime-internals';
import { activeSteps } from './step-routes';
import { dropServerErrors, pruneOffPathErrors } from './validation-state';

function resetValues(engine: EngineInternals): Record<string, unknown> {
  const fields = valueFields(engine.currentStep?.fields ?? []);
  const values = { ...engine.state.values };
  for (const { key } of fields) delete values[key];
  return Object.assign(values, createValues(fields));
}

export function skipTarget(engine: EngineInternals): FormStep | undefined {
  return activeSteps(engine.definition, resetValues(engine))[engine.currentStepIndex + 1];
}

export function skipCurrentStep(engine: EngineInternals): (kept: Set<string>) => void {
  const step = engine.currentStep!;
  const fieldKeys = valueFields(step.fields).map(({ key }) => key);
  baselineFields(engine);
  engine.state.values = resetValues(engine);
  const restore = engine.visibility.reseed(fieldKeys, engine.state.values);
  const owned = Object.keys(engine.errors).filter((key) => fieldKeys.includes(engine.visibility.owner(key)));
  for (const key of owned) delete engine.errors[key];
  dropServerErrors(engine, fieldKeys);
  engine.skipped.set(step.id, fieldKeys);
  dropServerErrors(engine, engine.visibility.reconcileHidden(engine.state.values, engine.errors));
  engine.visibility.markChanged(true, true);
  const pruned = pruneOffPathErrors(engine);
  engine.notify({ fieldKeys: [...fieldKeys, ...owned, ...pruned], structureChanged: true, valuesChanged: true });
  return restore;
}

export function includeCurrentStep(engine: EngineInternals): void {
  const step = engine.currentStep;
  if (step) engine.skipped.delete(step.id);
}

export function skipStepAt(engine: EngineInternals, index: number): (kept: Set<string>) => void {
  engine.state.currentStepIndex = index;
  engine.notify({ structureChanged: true });
  return skipCurrentStep(engine);
}
