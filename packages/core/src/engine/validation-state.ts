import { validateField, validateFields, validateStep } from '../validation';
import { createValues, getChangedKeys } from './engine-utils';
import type { EngineInternals } from './runtime-internals';

export function applyValidationErrors(engine: EngineInternals, errors: Record<string, string>, navigate = false): void {
  const previousErrors = engine.errors;
  engine.errors = {};
  engine.topLevelErrors = [];
  for (const [key, message] of Object.entries(errors)) {
    if (engine.visibility.isFieldVisible(key, engine.values)) engine.errors[key] = message;
    else engine.topLevelErrors.push(message);
  }
  const structureChanged = navigate && moveToFirstError(engine, errors);
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, engine.errors), structureChanged });
}

function moveToFirstError(engine: EngineInternals, errors: Record<string, string>): boolean {
  const firstErrorKey = Object.keys(errors).find((key) => engine.errors[key] !== undefined);
  const targetIndex = firstErrorKey && engine.isMultiStep
    ? engine.visibility.findStepIndex(firstErrorKey, engine.values, engine.currentStepIndex)
    : null;
  if (targetIndex === null || targetIndex === engine.currentStepIndex) return false;
  engine.currentStepIndex = targetIndex;
  return true;
}

export function clearResolvedMatchErrors(engine: EngineInternals, key: string): string[] {
  const cleared: string[] = [];
  for (const field of engine.visibility.allFields) {
    if (field.validation?.matchField !== key || engine.errors[field.key] === undefined) continue;
    if (validateField(field, engine.values[field.key], getValidationValues(engine), engine.validators)) continue;
    delete engine.errors[field.key];
    cleared.push(field.key);
  }
  return cleared;
}

export function pruneOffPathErrors(engine: EngineInternals): string[] {
  const pathFields = new Set(engine.visibleSteps.flatMap((step) => step.fields.map((field) => field.key)));
  const pruned = Object.keys(engine.errors).filter((key) => !pathFields.has(key));
  for (const key of pruned) delete engine.errors[key];
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
  engine.errors = errors;
  const structureChanged = navigate && moveToFirstError(engine, errors);
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, errors), structureChanged });
  return errors;
}

export function validateOne(engine: EngineInternals, key: string): string | null {
  const field = engine.visibility.activeField(key, engine.values);
  if (!field) return null;
  const previousError = engine.errors[key];
  const error = validateField(field, engine.values[key], getValidationValues(engine), engine.validators);
  if (error) engine.errors[key] = error;
  else delete engine.errors[key];
  const fieldKeys = Object.is(previousError, engine.errors[key]) ? [] : [key];
  engine.notify({ fieldKeys });
  return error;
}

export function getSubmitValues(engine: EngineInternals): Record<string, unknown> {
  return withoutSkipped(engine, { ...engine.visibility.conditionValues(engine.values) });
}

export function resetEngine(engine: EngineInternals, values?: Record<string, unknown>): void {
  const previousValues = engine.values;
  const previousErrors = engine.errors;
  const loadingFields = Object.keys(engine.fieldLoading);
  engine.validationEpoch++;
  engine.operationEpoch++;
  engine.submitting = false;
  engine.values = createValues(engine.visibility.allFields, values);
  engine.errors = {};
  engine.topLevelErrors = [];
  engine.fieldLoading = {};
  engine.stepValidating = false;
  engine.currentStepIndex = 0;
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
