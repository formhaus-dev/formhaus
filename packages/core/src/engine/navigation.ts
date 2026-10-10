import { getChangedKeys } from './engine-utils';
import { afterCommit } from './lifecycle-error';
import { watchCheckedInputs } from './pending-inputs';
import { validateStep } from '../validation';
import { applyValidationErrors, getValidationValues } from './validation-state';
import { includeCurrentStep, skipCurrentStep, skipTarget } from './step-skip';
import { submitAsync } from './submission';
import type { StepChangeContext, SubmitFn } from './engine-options';
import type { EngineInternals } from './runtime-internals';

function hasStepErrors(engine: EngineInternals): boolean {
  const step = engine.currentStep;
  if (!step) return true;
  const errors = validateStep(step, getValidationValues(engine), engine.validators);
  if (Object.keys(errors).length === 0) return false;
  const previousErrors = { ...engine.errors };
  Object.assign(engine.errors, errors);
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, engine.errors) });
  return true;
}

function moveTo(engine: EngineInternals, index: number): void {
  engine.validationEpoch++;
  engine.currentStepIndex = index;
  engine.notify({ structureChanged: true });
}

function advance(engine: EngineInternals): boolean {
  if (engine.isLastStep) return false;
  moveTo(engine, engine.currentStepIndex + 1);
  return true;
}

export function nextStep(engine: EngineInternals): boolean {
  if (!engine.isMultiStep) return false;
  includeCurrentStep(engine);
  return !hasStepErrors(engine) && advance(engine);
}

export function skipStep(engine: EngineInternals): boolean {
  if (!engine.isMultiStep || !skipTarget(engine)) return false;
  skipCurrentStep(engine);
  return advance(engine);
}

export async function skipStepAsync(engine: EngineInternals, submit?: SubmitFn): Promise<boolean> {
  if (!engine.isMultiStep || engine.stepValidating || engine.submitting) return false;
  if (skipTarget(engine)) return changeStep(engine, 'next', 'skip');
  const step = engine.currentStep;
  if (!submit || !step) return false;
  const values = engine.values;
  const errors = { ...engine.errors };
  let committed = false;
  const fieldKeys = skipCurrentStep(engine);
  const skippedValues = engine.values;
  const edited = watchCheckedInputs(engine, { ...skippedValues });
  try {
    return await submitAsync(engine, async (submitted, skipped) => {
      await submit(submitted, skipped);
      committed = true;
    }, true);
  } finally {
    if (!committed && engine.values === skippedValues && !edited()) {
      engine.values = values;
      engine.errors = { ...errors, ...engine.errors };
      engine.skipped.delete(step.id);
      engine.notify({ fieldKeys, structureChanged: true, valuesChanged: true });
    }
  }
}

export async function changeStep(engine: EngineInternals, direction: 'next' | 'back', reason: StepChangeContext['reason'] = direction): Promise<boolean> {
  const skipping = reason === 'skip';
  if (!engine.isMultiStep || engine.stepValidating || engine.submitting) return false;
  if (!skipping && (direction === 'next' ? engine.isLastStep : engine.isFirstStep)) return false;
  const step = engine.currentStep!;
  const validating = direction === 'next' && !skipping;
  if (validating) includeCurrentStep(engine);
  if (validating && hasStepErrors(engine)) return false;
  const lifecycle = { ...engine.lifecycle };
  const validate = engine.onStepValidate;
  let committed = false;
  const fromIndex = engine.currentStepIndex;
  const toIndex = fromIndex + (direction === 'next' ? 1 : -1);
  const target = skipping ? skipTarget(engine) : engine.visibleSteps[toIndex];
  if (!target) return false;
  const context = { fromStepId: step.id, toStepId: target.id, direction, reason, values: { ...getValidationValues(engine) } };
  const epoch = engine.validationEpoch;
  const operation = ++engine.operationEpoch;
  const inputsChanged = watchCheckedInputs(engine, context.values);
  const stale = () => epoch !== engine.validationEpoch || operation !== engine.operationEpoch
    || engine.currentStep?.id !== step.id || inputsChanged();
  engine.stepValidating = true;
  engine.notify();
  try {
    if (stale()) return false;
    if (validating && validate) {
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
    if (validating && hasStepErrors(engine)) return false;
    committed = true;
    if (skipping) skipCurrentStep(engine);
    moveTo(engine, toIndex);
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
  if (engine.isMultiStep && !engine.isFirstStep) moveTo(engine, engine.currentStepIndex - 1);
}

export function goToStepWithField(engine: EngineInternals, fieldKey: string): void {
  if (!engine.isMultiStep) return;
  const targetIndex = engine.visibility.findStepIndex(
    fieldKey,
    engine.values,
    engine.currentStepIndex,
  );
  if (targetIndex === engine.currentStepIndex) engine.notify();
  else if (targetIndex !== null) moveTo(engine, targetIndex);
}
