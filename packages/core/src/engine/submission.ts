import { afterCommit } from './lifecycle-error';
import { emit } from './form-events';
import { watchCheckedInputs } from './pending-inputs';
import type { SubmitHandler, SubmitResult } from './engine-options';
import type { EngineInternals } from './runtime-internals';
import { applyValidationErrors, clearFormErrors, getSubmitValues, validateForm } from './validation-state';
import { includeCurrentStep } from './step-skip';
import { abortWhenStale } from './operation-signal';
import { passesValidate } from './validate-hook';

type Rejection = Extract<SubmitResult, { ok: false }>;

export function isRejection(result: unknown): result is Rejection {
  return !!result && Object.getPrototypeOf(result) === Object.prototype && (result as SubmitResult).ok === false;
}

function applyRejection(engine: EngineInternals, result: Rejection, sent: Record<string, unknown>): void {
  const errors: Record<string, string> = {};
  const source = typeof result.errors === 'object' && result.errors ? result.errors : {};
  for (const [key, value] of Object.entries(source)) {
    const message: unknown = Array.isArray(value) ? value.join(' ') : value;
    if (typeof message === 'string' && Object.is(engine.state.values[engine.visibility.owner(key)], sent[engine.visibility.owner(key)]))
      errors[key] = message;
  }
  const formErrors = Array.isArray(result.formErrors) ? result.formErrors.filter((message) => typeof message === 'string') : [];
  applyValidationErrors(engine, errors, true, formErrors);
}

export async function submitForm(engine: EngineInternals, submit: SubmitHandler, keepSkipped = false): Promise<boolean> {
  if (engine.submitting || engine.stepValidating) return false;
  if (!keepSkipped) includeCurrentStep(engine);
  clearFormErrors(engine);
  const lifecycle = { ...engine.lifecycle };
  const epoch = engine.validationEpoch;
  const operation = (engine.latestOperation = ++engine.operationEpoch);
  let values = getSubmitValues(engine, true);
  const inputsChanged = watchCheckedInputs(engine, values);
  const stale = () => epoch !== engine.validationEpoch || operation !== engine.operationEpoch || inputsChanged();
  const pending = abortWhenStale(engine, stale);
  engine.state.submitting = true;
  engine.notify();
  const fail = () => {
    if (!stale()) emit(engine, { type: 'form_submit_failed', reason: 'validation' });
    return false;
  };
  const validate = lifecycle.onValidate;
  try {
    if (stale()) return false;
    const ruleErrors = validateForm(engine, true);
    const invalid = Object.keys(ruleErrors).length > 0;
    if (stale()) return false;
    if (invalid && !(validate && lifecycle.validateWithRules)) return fail();
    if (validate && !(await passesValidate(engine, validate, values, stale, pending.signal, true, ruleErrors))) return fail();
    if (invalid) return fail();
    if (lifecycle.onBeforeSubmit) {
      const allowed = await lifecycle.onBeforeSubmit(values, pending.signal);
      if (stale() || allowed === false) return false;
      if (Object.keys(validateForm(engine, true)).length > 0) return fail();
      if (stale()) return false;
      values = getSubmitValues(engine, true);
    }
    pending.stop();
    engine.sending = operation;
    const skippedSteps = [...engine.skipped.keys()];
    const sent = { ...engine.state.values };
    const serverErrors = engine.state.serverErrors;
    if (keepSkipped) emit(engine, { type: 'step_skipped', stepId: engine.currentStep!.id });
    emit(engine, { type: 'form_submitted', fieldCount: Object.keys(values).length });
    let result: unknown;
    try {
      result = await submit(values, [...skippedSteps]);
    } catch (error) {
      const status = (error as { status?: unknown } | null)?.status;
      emit(engine, { type: 'form_submit_failed', reason: 'error', ...(typeof status === 'number' && { status }) });
      throw error;
    }
    const rejected = isRejection(result);
    emit(engine, rejected ? { type: 'form_submit_failed', reason: 'rejected' } : { type: 'form_submit_succeeded' });
    if (operation !== engine.operationEpoch) return !rejected;
    if (rejected) {
      applyRejection(engine, result as Rejection, sent);
      return false;
    }
    if (engine.state.serverErrors === serverErrors) applyValidationErrors(engine, {}, true);
    await afterCommit('afterSubmit', () => lifecycle.onAfterSubmit?.(values, skippedSteps));
    return true;
  } catch (error) {
    if (engine.sending !== operation && stale()) return false;
    throw error;
  } finally {
    pending.stop();
    if (operation === engine.latestOperation) {
      engine.state.submitting = false;
      engine.notify();
    }
  }
}
