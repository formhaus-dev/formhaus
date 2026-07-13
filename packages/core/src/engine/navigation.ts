import { validateStep } from '../validation';
import { applyValidationErrors } from './validation-state';
import type { EngineInternals } from './runtime-internals';

function getStepErrors(engine: EngineInternals): Record<string, string> | null {
  const step = engine.currentStep;
  if (!step) return null;
  return validateStep(step, engine.values, engine.validators);
}

function publishStepErrors(engine: EngineInternals, errors: Record<string, string>): boolean {
  if (Object.keys(errors).length === 0) return false;
  const previousErrors = { ...engine.errors };
  Object.assign(engine.errors, errors);
  engine.notify({ fieldKeys: engine.getChangedKeys(previousErrors, engine.errors) });
  return true;
}

function advance(engine: EngineInternals): boolean {
  if (engine.isLastStep) return false;
  engine.currentStepIndex++;
  engine.notify({ structureChanged: true });
  return true;
}

export function nextStep(engine: EngineInternals): boolean {
  if (!engine.isMultiStep) return false;
  const errors = getStepErrors(engine);
  if (!errors || publishStepErrors(engine, errors)) return false;
  return advance(engine);
}

export async function nextStepAsync(engine: EngineInternals): Promise<boolean> {
  if (!engine.isMultiStep || engine.stepValidating) return false;
  const step = engine.currentStep;
  if (!step) return false;
  const errors = validateStep(step, engine.values, engine.validators);
  if (publishStepErrors(engine, errors)) return false;
  if (!engine.onStepValidate) return advance(engine);

  const stepIndexBefore = engine.currentStepIndex;
  const validationEpoch = engine.validationEpoch;
  engine.stepValidating = true;
  engine.notify();
  try {
    const result = await engine.onStepValidate(step.id, engine.values);
    if (engine.validationEpoch !== validationEpoch) return false;
    if (engine.currentStepIndex !== stepIndexBefore) return finishValidation(engine, false);
    if (result && Object.keys(result).length > 0) {
      engine.stepValidating = false;
      applyValidationErrors(engine, result);
      return false;
    }
    return finishValidation(engine, advanceAfterValidation(engine));
  } catch (error) {
    if (engine.validationEpoch !== validationEpoch) return false;
    engine.stepValidating = false;
    engine.notify();
    throw error;
  }
}

function advanceAfterValidation(engine: EngineInternals): boolean {
  if (engine.isLastStep) return false;
  engine.currentStepIndex++;
  return true;
}

function finishValidation(engine: EngineInternals, advanced: boolean): boolean {
  engine.stepValidating = false;
  engine.notify({ structureChanged: advanced });
  return advanced;
}

export function prevStep(engine: EngineInternals): void {
  if (!engine.isMultiStep || engine.isFirstStep) return;
  engine.currentStepIndex--;
  engine.notify({ structureChanged: true });
}

export function goToStepWithField(engine: EngineInternals, fieldKey: string): void {
  if (!engine.isMultiStep) return;
  const targetIndex = engine.visibility.findStepIndex(
    fieldKey,
    engine.values,
    engine.currentStepIndex,
  );
  if (targetIndex === null) return;
  const structureChanged = targetIndex !== engine.currentStepIndex;
  engine.currentStepIndex = targetIndex;
  engine.notify({ structureChanged });
}
