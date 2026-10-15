import { validateFieldValue, validateFields, validateStep } from '../validation';
import { createValues, getChangedKeys, initialState, shownError } from './engine-utils';
import type { FormField, FormNode } from '../types';
import { isGroup, itemPath, itemsOf, itemScope, valueFields } from '../visibility/nodes';
import type { EngineInternals } from './runtime-internals';
import type { ItemField } from './visibility-state';

export function errorKeys(nodes: FormNode[], errors: Record<string, string>, values: Record<string, unknown>): string[] {
  return valueFields(nodes).flatMap((field) => [
    ...(shownError(errors, field) ? [field.key] : []),
    ...(isGroup(field)
      ? itemsOf(values[field.key])
          .flatMap((_, index) => field.fields.map(({ key }) => itemPath(field.key, index, key)))
          .filter((key) => errors[key] !== undefined)
      : []),
  ]);
}

export function itemError(engine: EngineInternals, { group, index, field }: ItemField): string | null {
  const values = getSubmitValues(engine);
  const scope = itemScope(group, itemsOf(values[group.key])[index], values);
  return validateFieldValue(field, scope[field.key], scope, engine.validators, engine.messages);
}

export function applyValidationErrors(
  engine: EngineInternals,
  errors: Record<string, string>,
  server = false,
  formErrors: string[] = [],
): void {
  const { state } = engine;
  const previousErrors = engine.errors;
  const bound: Record<string, string> = {};
  const general = [...formErrors];
  for (const [key, message] of Object.entries(errors)) {
    if (engine.visibility.activeField(key, engine.values) || engine.visibility.activeItem(key, engine.values)) bound[key] = message;
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
  const targetIndex = engine.visibleSteps.findIndex((step) => errorKeys(step.fields, errors, engine.values).length > 0);
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
  const dropped = new Set(keys);
  const { serverErrors } = engine.state;
  for (const key of Object.keys(serverErrors)) if (dropped.has(key) || dropped.has(engine.visibility.owner(key))) delete serverErrors[key];
}

export function clearResolvedMatchErrors(engine: EngineInternals, key: string, item?: ItemField): string[] {
  const cleared: string[] = [];
  const fields: [string, FormField][] = item
    ? item.group.fields.map((field) => [itemPath(item.group.key, item.index, field.key), field])
    : engine.visibility.allFields.map((field) => [field.key, field]);
  for (const [path, field] of fields) {
    if (field.validation?.matchField !== key || engine.errors[path] === undefined) continue;
    const error = item
      ? itemError(engine, { ...item, field })
      : validateFieldValue(field, engine.values[field.key], getSubmitValues(engine), engine.validators, engine.messages);
    if (error) continue;
    clearError(engine, path);
    cleared.push(path);
  }
  if (!item) {
    for (const group of engine.visibility.groups) {
      if (
        engine.visibility.activeField(group.key, engine.values) !== group ||
        !group.fields.some((field) => field.validation?.matchField === key)
      )
        continue;
      itemsOf(engine.values[group.key]).forEach((_, index) =>
        cleared.push(...clearResolvedMatchErrors(engine, key, { group, index, field: group.fields[0] })),
      );
    }
  }
  return cleared;
}

export function pruneOffPathErrors(engine: EngineInternals): string[] {
  const pathFields = new Set(engine.visibleSteps.flatMap((step) => valueFields(step.fields).map((field) => field.key)));
  const pruned = Object.keys(engine.errors).filter((key) => !pathFields.has(engine.visibility.owner(key)));
  for (const key of pruned) delete engine.errors[key];
  dropServerErrors(engine, pruned);
  return pruned;
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
      Object.assign(errors, validateStep(step, getSubmitValues(engine), engine.validators, engine.messages));
    }
  } else {
    Object.assign(errors, validateFields(engine.definition.fields ?? [], getSubmitValues(engine), engine.validators, engine.messages));
  }
  engine.state.errors = { ...engine.state.serverErrors, ...errors };
  const structureChanged = navigate && moveToFirstError(engine, errors);
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, errors), structureChanged });
  return errors;
}

export function validateOne(engine: EngineInternals, key: string): string | null {
  const field = engine.visibility.activeField(key, engine.values);
  const item = !field && engine.visibility.activeItem(key, engine.values);
  if (!field && !item) return null;
  const previousError = engine.errors[key];
  const error = item
    ? itemError(engine, item)
    : validateFieldValue(field!, engine.values[key], getSubmitValues(engine), engine.validators, engine.messages);
  if (error) engine.errors[key] = error;
  else clearError(engine, key, true);
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
  Object.assign(engine.state, initialState(createValues(engine.visibility.allFields, values)));
  engine.skipped.clear();
  engine.visibility.reconcileHidden(engine.values, engine.errors, true);
  const changedValues = getChangedKeys(previousValues, engine.values);
  const changedFields = new Set([...changedValues, ...getChangedKeys(previousErrors, engine.errors), ...loadingFields]);
  engine.notify({
    fieldKeys: changedFields,
    structureChanged: true,
    valuesChanged: changedValues.size > 0,
  });
}
