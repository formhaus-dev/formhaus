import { validateFieldValue, validateFields, validateStep } from '../validation';
import { createValues, getChangedKeys } from './engine-utils';
import { trimValue } from '../validation/type-checks';
import type { EngineInternals } from './runtime-internals';

export function applyValidationErrors(engine: EngineInternals, errors: Record<string, string>, server = false, formErrors: string[] = []): void {
  const { state } = engine;
  const previousErrors = engine.errors;
  const bound: Record<string, string> = {};
  const general = [...formErrors];
  for (const [key, message] of Object.entries(errors)) {
    if (engine.visibility.activeField(key, engine.values)) bound[key] = message;
    else general.push(message);
  }
  if (server) {
    state.serverErrors = bound;
    state.serverFormErrors = general;
  }
  state.errors = { ...state.serverErrors, ...bound };
  state.topLevelErrors = server ? general : [...state.serverFormErrors, ...general];
  const structureChanged = server && moveToFirstError(engine, bound);
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, engine.errors), structureChanged });
}

function moveToFirstError(engine: EngineInternals, errors: Record<string, string>): boolean {
  const targetIndex = engine.visibleSteps.findIndex((step) => step.fields.some((field) => errors[field.key] !== undefined));
  if (targetIndex < 0 || targetIndex === engine.currentStepIndex) return false;
  engine.state.currentStepIndex = targetIndex;
  return true;
}

export function clearError(engine: EngineInternals, key: string, server = false): void {
  if (server) delete engine.state.serverErrors[key];
  const kept = engine.state.serverErrors[key];
  if (kept === undefined) delete engine.errors[key];
  else engine.errors[key] = kept;
}

export function dropServerErrors(engine: EngineInternals, keys: Iterable<string>): void {
  for (const key of keys) delete engine.state.serverErrors[key];
}

export function clearResolvedMatchErrors(engine: EngineInternals, key: string): string[] {
  const cleared: string[] = [];
  for (const field of engine.visibility.allFields) {
    if (field.validation?.matchField !== key || engine.errors[field.key] === undefined) continue;
    if (validateFieldValue(field, engine.values[field.key], getValidationValues(engine), engine.validators)) continue;
    clearError(engine, field.key);
    cleared.push(field.key);
  }
  return cleared;
}

export function pruneOffPathErrors(engine: EngineInternals): string[] {
  const pathFields = new Set(engine.visibleSteps.flatMap((step) => step.fields.map((field) => field.key)));
  const pruned = Object.keys(engine.errors).filter((key) => !pathFields.has(key));
  for (const key of pruned) delete engine.errors[key];
  dropServerErrors(engine, pruned);
  return pruned;
}

export function getValidationValues(engine: EngineInternals): Record<string, unknown> {
  return getSubmitValues(engine);
}

function withoutSkipped(engine: EngineInternals, values: Record<string, unknown>): Record<string, unknown> {
  for (const key of [...engine.skipped.values()].flat()) delete values[key];
  return values;
}

export function validateForm(engine: EngineInternals, navigate = false): Record<string, string> {
  const previousErrors = engine.errors;
  const errors: Record<string, string> = {};
  if (engine.isMultiStep) {
    for (const step of engine.visibleSteps) {
      if (engine.skipped.has(step.id)) continue;
      Object.assign(errors, validateStep(step, getValidationValues(engine), engine.validators));
    }
  } else {
    Object.assign(
      errors,
      validateFields(engine.definition.fields ?? [], getValidationValues(engine), engine.validators),
    );
  }
  engine.state.errors = { ...engine.state.serverErrors, ...errors };
  const structureChanged = navigate && moveToFirstError(engine, errors);
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, errors), structureChanged });
  return errors;
}

export function validateOne(engine: EngineInternals, key: string): string | null {
  const field = engine.visibility.activeField(key, engine.values);
  if (!field) return null;
  const previousError = engine.errors[key];
  const error = validateFieldValue(field, engine.values[key], getValidationValues(engine), engine.validators);
  if (error) engine.errors[key] = error;
  else clearError(engine, key, true);
  const fieldKeys = Object.is(previousError, engine.errors[key]) ? [] : [key];
  engine.notify({ fieldKeys });
  return error;
}

export function getSubmitValues(engine: EngineInternals): Record<string, unknown> {
  const values = { ...engine.visibility.conditionValues(engine.values) };
  for (const key of Object.keys(values)) {
    const field = engine.visibility.activeField(key, engine.values);
    if (field) values[key] = trimValue(field, values[key]);
  }
  return withoutSkipped(engine, values);
}

export function resetEngine(engine: EngineInternals, values?: Record<string, unknown>): void {
  const previousValues = engine.values;
  const previousErrors = engine.errors;
  const loadingFields = Object.keys(engine.fieldLoading);
  engine.validationEpoch++;
  engine.operationEpoch++;
  engine.state.submitting = false;
  engine.state.values = createValues(engine.visibility.allFields, values);
  engine.state.errors = {};
  engine.state.topLevelErrors = [];
  engine.state.serverErrors = {};
  engine.state.serverFormErrors = [];
  engine.state.fieldLoading = {};
  engine.state.stepValidating = false;
  engine.state.currentStepIndex = 0;
  engine.skipped.clear();
  engine.visibility.reconcileHidden(engine.values, engine.errors);
  const changedValues = getChangedKeys(previousValues, engine.values);
  const changedFields = new Set([
    ...changedValues,
    ...getChangedKeys(previousErrors, engine.errors),
    ...loadingFields,
  ]);
  engine.notify({
    fieldKeys: changedFields,
    structureChanged: true,
    valuesChanged: changedValues.size > 0,
  });
}
