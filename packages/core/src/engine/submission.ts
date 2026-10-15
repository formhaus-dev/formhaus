import { afterCommit } from './lifecycle-error';
import { watchCheckedInputs } from './pending-inputs';
import type { SubmitHandler, SubmitResult } from './engine-options';
import type { EngineInternals } from './runtime-internals';
import { applyValidationErrors, getSubmitValues, validateForm } from './validation-state';
import { includeCurrentStep } from './step-skip';

type Rejection = Extract<SubmitResult, { ok: false }>;

export function isRejection(result: unknown): result is Rejection {
  return !!result && Object.getPrototypeOf(result) === Object.prototype && (result as SubmitResult).ok === false;
}

function applyRejection(engine: EngineInternals, result: Rejection, sent: Record<string, unknown>): void {
  const errors: Record<string, string> = {};
  const source = typeof result.errors === 'object' && result.errors ? result.errors : {};
  for (const [key, value] of Object.entries(source)) {
    const message: unknown = Array.isArray(value) ? value.join(' ') : value;
    if (typeof message === 'string' && Object.is(engine.values[key], sent[key])) errors[key] = message;
  }
  const formErrors = Array.isArray(result.formErrors) ? result.formErrors.filter((message) => typeof message === 'string') : [];
  applyValidationErrors(engine, errors, true, formErrors);
}

export async function submitForm(engine: EngineInternals, submit: SubmitHandler, keepSkipped = false): Promise<boolean> {
  if (engine.submitting || engine.stepValidating) return false;
  if (!keepSkipped) includeCurrentStep(engine);
  const lifecycle = { ...engine.lifecycle };
  let dispatched = false;
  const epoch = engine.validationEpoch;
  const operation = (engine.latestOperation = ++engine.operationEpoch);
  let values = getSubmitValues(engine);
  const inputsChanged = watchCheckedInputs(engine, values);
  const stale = () => epoch !== engine.validationEpoch || operation !== engine.operationEpoch || inputsChanged();
  engine.state.submitting = true;
  engine.notify();
  try {
    if (stale()) return false;
    if (Object.keys(validateForm(engine, true)).length > 0 || stale()) return false;
    if (lifecycle.onBeforeSubmit) {
      const allowed = await lifecycle.onBeforeSubmit(values);
      if (stale() || allowed === false) return false;
    }
    if (stale()) return false;
    if (lifecycle.onBeforeSubmit) {
      if (Object.keys(validateForm(engine, true)).length > 0 || stale()) return false;
      values = getSubmitValues(engine);
    }
    dispatched = true;
    const skippedSteps = [...engine.skipped.keys()];
    const sent = { ...engine.values };
    const serverErrors = engine.state.serverErrors;
    const result = await submit(values, [...skippedSteps]);
    const rejected = isRejection(result);
    if (operation !== engine.operationEpoch) return !rejected;
    if (rejected) {
      applyRejection(engine, result, sent);
      return false;
    }
    if (engine.state.serverErrors === serverErrors) applyValidationErrors(engine, {}, true);
    await afterCommit('afterSubmit', () => lifecycle.onAfterSubmit?.(values, skippedSteps));
    return true;
  } catch (error) {
    if (!dispatched && stale()) return false;
    throw error;
  } finally {
    if (operation === engine.operationEpoch) {
      engine.state.submitting = false;
      engine.notify();
    }
  }
}
