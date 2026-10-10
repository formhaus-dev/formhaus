import { afterCommit } from './lifecycle-error';
import { watchCheckedInputs } from './pending-inputs';
import type { SubmitFn } from './engine-options';
import type { EngineInternals } from './runtime-internals';
import { getSubmitValues, validateForm } from './validation-state';
import { includeCurrentStep } from './step-skip';

export async function submitAsync(engine: EngineInternals, submit: SubmitFn, keepSkipped = false): Promise<boolean> {
  if (engine.submitting || engine.stepValidating) return false;
  if (!keepSkipped) includeCurrentStep(engine);
  const lifecycle = { ...engine.lifecycle };
  let dispatched = false;
  const epoch = engine.validationEpoch;
  const operation = ++engine.operationEpoch;
  let values = getSubmitValues(engine);
  const inputsChanged = watchCheckedInputs(engine, values);
  const stale = () => epoch !== engine.validationEpoch || operation !== engine.operationEpoch || inputsChanged();
  engine.submitting = true;
  engine.notify();
  try {
    if (stale()) return false;
    if (Object.keys(validateForm(engine)).length > 0 || stale()) return false;
    if (lifecycle.onBeforeSubmit) {
      const allowed = await lifecycle.onBeforeSubmit(values);
      if (stale() || allowed === false) return false;
    }
    if (stale()) return false;
    if (lifecycle.onBeforeSubmit) {
      if (Object.keys(validateForm(engine)).length > 0 || stale()) return false;
      values = getSubmitValues(engine);
    }
    dispatched = true;
    await submit(values, [...engine.skipped.keys()]);
    if (operation !== engine.operationEpoch) return true;
    await afterCommit('afterSubmit', () => lifecycle.onAfterSubmit?.(values));
    return true;
  } catch (error) {
    if (!dispatched && stale()) return false;
    throw error;
  } finally {
    if (operation === engine.operationEpoch) {
      engine.submitting = false;
      engine.notify();
    }
  }
}
