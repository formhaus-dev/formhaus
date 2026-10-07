import { afterCommit } from './lifecycle-error';
import { watchCheckedInputs } from './pending-inputs';
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
  engine.validationEpoch++;
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

export function nextStepAsync(engine: EngineInternals, reason: 'next' | 'autoAdvance' = 'next'): Promise<boolean> {
  return changeStep(engine, 'next', reason);
}

export function prevStepAsync(engine: EngineInternals): Promise<boolean> {
  return changeStep(engine, 'back');
}

async function changeStep(engine: EngineInternals, direction: 'next' | 'back', reason: 'next' | 'back' | 'autoAdvance' = direction): Promise<boolean> {
  if (!engine.isMultiStep || engine.stepValidating || engine.submitting) return false;
  if (direction === 'next' ? engine.isLastStep : engine.isFirstStep) return false;
  const step = engine.currentStep;
  if (!step) return false;
  if (direction === 'next' && publishStepErrors(engine, validateStep(step, engine.values, engine.validators))) return false;
  const lifecycle = { ...engine.lifecycle };
  const validate = engine.onStepValidate;
  let committed = false;
  const fromIndex = engine.currentStepIndex;
  const toIndex = fromIndex + (direction === 'next' ? 1 : -1);
  const target = engine.visibleSteps[toIndex];
  if (!target) return false;
  const context = { fromStepId: step.id, toStepId: target.id, direction, reason, values: { ...engine.values } };
  const epoch = engine.validationEpoch;
  const operation = ++engine.operationEpoch;
  const inputsChanged = watchCheckedInputs(engine, context.values);
  const stale = () => epoch !== engine.validationEpoch || operation !== engine.operationEpoch
    || engine.currentStep?.id !== step.id || inputsChanged();
  engine.stepValidating = true;
  engine.notify();
  try {
    if (stale()) return false;
    if (direction === 'next' && validate) {
      const result = await validate!(step.id, context.values);
      if (stale()) return false;
      if (result && Object.keys(result).length > 0) {
        applyValidationErrors(engine, result);
        return false;
      }
    }
    if (lifecycle.onBeforeStepChange) {
      const allowed = await lifecycle.onBeforeStepChange(context);
      if (stale() || allowed === false) return false;
    }
    if (stale()) return false;
    if (direction === 'next' && publishStepErrors(engine, validateStep(step, engine.values, engine.validators))) return false;
    committed = true;
    engine.currentStepIndex = toIndex;
    engine.validationEpoch++;
    engine.notify({ structureChanged: true });
    await afterCommit('afterStepChange', () => lifecycle.onAfterStepChange?.(context));
    return true;
  } catch (error) {
    if (!committed && stale()) return false;
    throw error;
  } finally {
    if (operation === engine.operationEpoch) {
      engine.stepValidating = false;
      engine.notify();
    }
  }
}

export function prevStep(engine: EngineInternals): void {
  if (!engine.isMultiStep || engine.isFirstStep) return;
  engine.validationEpoch++;
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
  if (structureChanged) engine.validationEpoch++;
  engine.currentStepIndex = targetIndex;
  engine.notify({ structureChanged });
}
