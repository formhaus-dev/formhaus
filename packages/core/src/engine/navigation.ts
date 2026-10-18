import { getChangedKeys } from './engine-utils';
import { afterCommit } from './lifecycle-error';
import { watchCheckedInputs, watchValues } from './pending-inputs';
import { applyValidationErrors, dropServerErrors, fieldsErrors, getSubmitValues, pruneOffPathErrors } from './validation-state';
import { includeCurrentStep, skipCurrentStep, skipTarget } from './step-skip';
import { reconcileStepIndex } from './step-routes';
import { isRejection, submitForm } from './submission';
import type { StepChangeContext, SubmitHandler } from './engine-options';
import type { EngineInternals } from './runtime-internals';

function hasStepErrors(engine: EngineInternals): boolean {
  const step = engine.currentStep;
  if (!step) return true;
  const errors = fieldsErrors(engine, step.fields);
  if (Object.keys(errors).length === 0) return false;
  const previousErrors = engine.errors;
  engine.state.errors = { ...previousErrors, ...errors };
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, engine.errors) });
  return true;
}

function moveTo(engine: EngineInternals, index: number): void {
  engine.validationEpoch++;
  engine.state.currentStepIndex = index;
  engine.notify({ structureChanged: true });
}

export async function skipStep(engine: EngineInternals, submit?: SubmitHandler): Promise<boolean> {
  if (!engine.isMultiStep || engine.stepValidating || engine.submitting || !engine.currentStep?.skip) return false;
  if (skipTarget(engine)) return changeStep(engine, 'next', 'skip');
  const step = engine.currentStep;
  if (!submit || !step) return false;
  const values = engine.values;
  const errors = { ...engine.errors };
  const serverErrors = { ...engine.state.serverErrors };
  let outcome: boolean | undefined;
  const restore = skipCurrentStep(engine);
  const skippedValues = engine.values;
  const edited = watchValues(engine, skippedValues);
  const written = engine.visibility.watchWrites();
  const submitting = submitForm(
    engine,
    async (submitted, skipped) => {
      const result = await submit(submitted, skipped);
      const rejected = isRejection(result);
      if (!rejected || operation === engine.operationEpoch) outcome = rejected;
      return result;
    },
    true,
  );
  const operation = engine.latestOperation;
  try {
    return await submitting;
  } finally {
    const writes = written();
    if (outcome !== false && operation === engine.latestOperation && engine.values === skippedValues) {
      const steps = engine.visibleSteps;
      const kept = new Set([...edited(), ...writes]);
      const current = engine.values;
      engine.state.values = { ...values };
      for (const key of kept) {
        delete engine.values[key];
        for (const record of [errors, serverErrors])
          for (const errorKey of Object.keys(record)) if (engine.visibility.owner(errorKey) === key) delete record[errorKey];
        if (key in current) engine.values[key] = current[key];
      }
      const reverted = getChangedKeys(current, engine.values);
      if (outcome === undefined) engine.state.serverErrors = serverErrors;
      else dropServerErrors(engine, reverted);
      const fresh = { ...engine.errors };
      for (const key in fresh) if (reverted.has(engine.visibility.owner(key))) delete fresh[key];
      engine.state.errors = { ...(outcome ? {} : errors), ...fresh };
      engine.skipped.delete(step.id);
      restore(writes);
      dropServerErrors(engine, engine.visibility.reconcileHidden(engine.values, engine.errors));
      engine.visibility.markChanged(true, true);
      engine.state.currentStepIndex = reconcileStepIndex(steps, engine.visibleSteps, engine.currentStepIndex);
      pruneOffPathErrors(engine);
      engine.notify({ fieldKeys: Object.keys({ ...values, ...current, ...errors }), structureChanged: true, valuesChanged: true });
    }
  }
}

export async function changeStep(
  engine: EngineInternals,
  direction: 'next' | 'back',
  reason: StepChangeContext['reason'] = direction,
): Promise<boolean> {
  const skipping = reason === 'skip';
  if (!engine.isMultiStep || engine.stepValidating || engine.submitting) return false;
  if (!skipping && (direction === 'next' ? engine.isLastStep : engine.isFirstStep)) return false;
  const step = engine.currentStep!;
  const validating = direction === 'next' && !skipping;
  if (validating) includeCurrentStep(engine);
  if (validating && hasStepErrors(engine)) return false;
  const lifecycle = { ...engine.lifecycle };
  const validate = lifecycle.onStepValidate;
  let committed = false;
  const fromIndex = engine.currentStepIndex;
  const toIndex = fromIndex + (direction === 'next' ? 1 : -1);
  const target = skipping ? skipTarget(engine) : engine.visibleSteps[toIndex];
  if (!target) return false;
  const context: StepChangeContext = { fromStepId: step.id, toStepId: target.id, reason, values: { ...getSubmitValues(engine) } };
  const epoch = engine.validationEpoch;
  const operation = (engine.latestOperation = ++engine.operationEpoch);
  const inputsChanged = watchCheckedInputs(engine, context.values);
  const stale = () =>
    epoch !== engine.validationEpoch || operation !== engine.operationEpoch || engine.currentStep?.id !== step.id || inputsChanged();
  engine.state.stepValidating = true;
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
    if (direction === 'next') engine.lifecycle.onFormEvent?.({ type: skipping ? 'step_skipped' : 'step_completed', stepId: step.id });
    if (skipping) skipCurrentStep(engine);
    moveTo(engine, toIndex);
    await afterCommit('afterStepChange', () => lifecycle.onAfterStepChange?.(context));
    return true;
  } catch (error) {
    if (!committed && stale()) return false;
    throw error;
  } finally {
    if (operation === engine.operationEpoch) {
      engine.state.stepValidating = false;
      engine.notify();
    }
  }
}

export function goToStepWithField(engine: EngineInternals, fieldKey: string): void {
  if (!engine.isMultiStep) return;
  const targetIndex = engine.visibility.findStepIndex(fieldKey, engine.values, engine.currentStepIndex);
  if (targetIndex === engine.currentStepIndex) engine.notify();
  else if (targetIndex !== null) moveTo(engine, targetIndex);
}
