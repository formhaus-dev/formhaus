import { validateField, validateFields, validateStep } from '../validation';
import type { FormDefinition } from '../types';
import { createValues, getChangedKeys } from './engine-utils';
import type { EngineInternals } from './runtime-internals';

function replaceErrors(engine: EngineInternals, errors: Record<string, string>): Set<string> {
  const previousErrors = engine.errors;
  engine.errors = {};
  engine.topLevelErrors = [];
  for (const [key, message] of Object.entries(errors)) {
    if (engine.visibility.isFieldVisible(key, engine.values)) {
      engine.errors[key] = message;
    } else {
      engine.topLevelErrors.push(message);
    }
  }
  return getChangedKeys(previousErrors, engine.errors);
}

export function applyExternalErrors(engine: EngineInternals, errors: Record<string, string>): void {
  const changedFields = replaceErrors(engine, errors);
  const firstErrorKey = Object.keys(errors).find((key) => engine.errors[key] !== undefined);
  const targetIndex = firstErrorKey && engine.isMultiStep
    ? engine.visibility.findStepIndex(firstErrorKey, engine.values, engine.currentStepIndex)
    : null;
  const structureChanged = targetIndex !== null && targetIndex !== engine.currentStepIndex;
  if (targetIndex !== null) engine.currentStepIndex = targetIndex;
  engine.notify({ fieldKeys: changedFields, structureChanged });
}

export function applyValidationErrors(
  engine: EngineInternals,
  errors: Record<string, string>,
): void {
  const changedFields = replaceErrors(engine, errors);
  engine.notify({ fieldKeys: changedFields });
}

export function validateForm(engine: EngineInternals): Record<string, string> {
  const previousErrors = engine.errors;
  const errors: Record<string, string> = {};
  if (engine.isMultiStep) {
    for (const step of engine.visibleSteps) {
      Object.assign(errors, validateStep(step, engine.values, engine.validators));
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
  const error = validateField(field, engine.values[key], engine.values, engine.validators);
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
  return result;
}

export function resetEngine(engine: EngineInternals, values?: Record<string, unknown>): void {
  const previousValues = engine.values;
  const previousErrors = engine.errors;
  const loadingFields = Object.keys(engine.fieldLoading);
  engine.validationEpoch++;
  engine.values = createValues(engine.visibility.allFields, values);
  engine.errors = {};
  engine.topLevelErrors = [];
  engine.fieldLoading = {};
  engine.stepValidating = false;
  engine.currentStepIndex = 0;
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
  const hasFields = (definition.fields?.length ?? 0) > 0;
  const hasSteps = (definition.steps?.length ?? 0) > 0;
  if (hasFields && hasSteps) {
    throw new Error('FormDefinition cannot have both "fields" and "steps" as non-empty arrays.');
  }
}
