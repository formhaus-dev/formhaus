import { validateField, validateFields, validateStep } from '../validation';
import type { FormDefinition } from '../types';
import { createValues, getChangedKeys, hasFieldsAndSteps } from './engine-utils';
import type { EngineInternals } from './runtime-internals';

export function applyValidationErrors(engine: EngineInternals, errors: Record<string, string>, navigate = false): void {
  const previousErrors = engine.errors;
  engine.errors = {};
  engine.topLevelErrors = [];
  for (const [key, message] of Object.entries(errors)) {
    if (engine.visibility.isFieldVisible(key, engine.values)) engine.errors[key] = message;
    else engine.topLevelErrors.push(message);
  }
  const firstErrorKey = Object.keys(errors).find((key) => engine.errors[key] !== undefined);
  const targetIndex = navigate && firstErrorKey && engine.isMultiStep
    ? engine.visibility.findStepIndex(firstErrorKey, engine.values, engine.currentStepIndex)
    : null;
  const structureChanged = targetIndex !== null && targetIndex !== engine.currentStepIndex;
  if (targetIndex !== null) engine.currentStepIndex = targetIndex;
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, engine.errors), structureChanged });
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
  return engine.definition.steps?.some((step) => step.routes?.length) ? getSubmitValues(engine) : engine.values;
}

export function validateForm(engine: EngineInternals): Record<string, string> {
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
      validateFields(engine.definition.fields ?? [], engine.values, engine.validators),
    );
  }
  engine.errors = errors;
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, errors) });
  return errors;
}

export function validateOne(engine: EngineInternals, key: string): string | null {
  const field = engine.visibility.fieldByKey.get(key);
  if (!field || !engine.visibility.isFieldVisible(key, engine.values)) return null;
  const previousError = engine.errors[key];
  const error = validateField(field, engine.values[key], getValidationValues(engine), engine.validators);
  if (error) engine.errors[key] = error;
  else delete engine.errors[key];
  const fieldKeys = Object.is(previousError, engine.errors[key]) ? [] : [key];
  engine.notify({ fieldKeys });
  return error;
}

export function getSubmitValues(engine: EngineInternals): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const visibleKeys = engine.visibility.getVisibleFieldKeys(
    engine.values,
    engine.currentStepIndex,
  );
  for (const key of visibleKeys) {
    if (engine.values[key] !== undefined) result[key] = engine.values[key];
  }
  for (const key of [...engine.skipped.values()].flat()) delete result[key];
  return result;
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

export function assertDefinitionShape(definition: FormDefinition): void {
  if (hasFieldsAndSteps(definition)) {
    throw new Error('FormDefinition cannot have both "fields" and "steps" as non-empty arrays.');
  }
}
