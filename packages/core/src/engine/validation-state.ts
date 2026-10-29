import { validateFieldValue } from '../validation';
import { baselineFields, emit } from './form-events';
import { customRules, validateShown } from '../validation/validate-step';
import { withPatternBudget } from '../validation/validate-field';
import { isPlainEntry, trimValue } from '../validation/type-checks';
import { createValues, getChangedKeys, initialState, keptValues, shownError } from './engine-utils';
import type { FormField, FormNode } from '../types';
import { cleanItems, isGroup, itemPath, itemsOf, itemScope, valueFields } from '../visibility/nodes';
import type { EngineInternals } from './runtime-internals';
import type { ItemField } from './visibility-state';

export function errorKeys(nodes: FormNode[], errors: Record<string, string>, values: Record<string, unknown>): string[] {
  if (Object.keys(errors).length === 0) return [];
  return valueFields(nodes).flatMap((field) => [
    ...(shownError(errors, field) ? [field.key] : []),
    ...(isGroup(field)
      ? itemsOf(values[field.key])
          .flatMap((_, index) => field.fields.map(({ key }) => itemPath(field.key, index, key)))
          .filter((key) => errors[key] !== undefined)
      : []),
  ]);
}

function unsettleOnWrite<T>(engine: EngineInternals, run: () => T): T {
  const version = engine.getSnapshot();
  const result = run();
  if (version !== engine.getSnapshot()) engine.visibility.unsettle();
  return result;
}

export function fieldsErrors(engine: EngineInternals, nodes: FormNode[], values = getSubmitValues(engine)): Record<string, string> {
  const scope = engine.visibility.conditionValues(engine.state.values);
  return unsettleOnWrite(engine, () => validateShown(nodes, values, scope, engine));
}

function fieldError(engine: EngineInternals, field: FormField, value: unknown, values = getSubmitValues(engine)): string | null {
  return unsettleOnWrite(engine, () => validateFieldValue(field, value, values, engine));
}

function itemError(engine: EngineInternals, { group, index, field }: ItemField): string | null {
  const values = getSubmitValues(engine);
  const scope = itemScope(group, itemsOf(values[group.key])[index], values);
  return fieldError(engine, field, scope[field.key], scope);
}

export function applyValidationErrors(
  engine: EngineInternals,
  errors: Record<string, string>,
  server = false,
  formErrors: string[] = [],
  navigate = server,
): void {
  const { state } = engine;
  const previousErrors = engine.errors;
  const bound: Record<string, string> = {};
  const general = [...formErrors];
  for (const [key, message] of Object.entries(errors)) {
    if (engine.visibility.activeField(key, engine.state.values) || engine.visibility.activeItem(key, engine.state.values))
      bound[key] = message;
    else general.push(message);
  }
  if (server) {
    state.serverErrors = bound;
    state.serverFormErrors = general;
  }
  state.errors = { ...state.serverErrors, ...bound };
  state.topLevelErrors = server ? general : [...state.serverFormErrors, ...general];
  const structureChanged = navigate && moveToFirstError(engine, bound);
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, engine.errors), structureChanged });
}

function moveToFirstError(engine: EngineInternals, errors: Record<string, string>): boolean {
  const targetIndex = engine.visibleSteps.findIndex((step) => errorKeys(step.fields, errors, engine.state.values).length > 0);
  if (targetIndex < 0 || targetIndex === engine.currentStepIndex) return false;
  engine.state.currentStepIndex = targetIndex;
  return true;
}

export function clearFormErrors(engine: EngineInternals): void {
  engine.state.topLevelErrors = [...engine.state.serverFormErrors];
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
    const error = item ? itemError(engine, { ...item, field }) : fieldError(engine, field, engine.state.values[field.key]);
    if (error) continue;
    clearError(engine, path);
    cleared.push(path);
  }
  if (!item) {
    for (const group of engine.visibility.groups) {
      if (
        engine.visibility.activeField(group.key, engine.state.values) !== group ||
        !group.fields.some((field) => field.validation?.matchField === key)
      )
        continue;
      itemsOf(engine.state.values[group.key]).forEach((_, index) => {
        cleared.push(...clearResolvedMatchErrors(engine, key, { group, index, field: group.fields[0] }));
      });
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
  const errors = withPatternBudget(() => formErrors(engine));
  engine.state.errors = { ...engine.state.serverErrors, ...errors };
  const structureChanged = navigate && moveToFirstError(engine, errors);
  engine.notify({ fieldKeys: getChangedKeys(previousErrors, errors), structureChanged });
  return errors;
}

function formErrors(engine: EngineInternals): Record<string, string> {
  const errors: Record<string, string> = {};
  if (engine.isMultiStep) {
    let version = -1;
    let values: Record<string, unknown> = {};
    for (const step of engine.visibleSteps)
      if (!engine.skipped.has(step.id)) {
        if (version !== engine.getSnapshot()) {
          version = engine.getSnapshot();
          values = getSubmitValues(engine);
        }
        Object.assign(errors, fieldsErrors(engine, step.fields, customRules(step.fields) ? { ...values } : values));
      }
  } else {
    Object.assign(errors, fieldsErrors(engine, engine.definition.fields ?? []));
  }
  return errors;
}

export function retranslateErrors(engine: EngineInternals): void {
  const previous = engine.errors;
  const errors = { ...previous };
  for (const key of Object.keys(errors)) {
    if (engine.state.serverErrors[key] !== undefined) continue;
    const field = engine.visibility.activeField(key, engine.state.values);
    const item = !field && engine.visibility.activeItem(key, engine.state.values);
    const error = field ? fieldError(engine, field, engine.state.values[key]) : item ? itemError(engine, item) : null;
    if (error) errors[key] = error;
  }
  const fieldKeys = getChangedKeys(previous, errors);
  if (fieldKeys.size === 0) return;
  engine.state.errors = errors;
  engine.notify({ fieldKeys });
}

export function validateOne(engine: EngineInternals, key: string): string | null {
  const field = engine.visibility.activeField(key, engine.state.values);
  const item = !field && engine.visibility.activeItem(key, engine.state.values);
  if (!field && !item) return null;
  const previousError = engine.errors[key];
  const error = item ? itemError(engine, item) : fieldError(engine, field!, engine.state.values[key]);
  if (error) engine.errors[key] = error;
  else clearError(engine, key, true);
  const fieldKeys = Object.is(previousError, engine.errors[key]) ? [] : [key];
  engine.notify({ fieldKeys });
  return error;
}

export function getSubmitValues(engine: EngineInternals, payload = false): Record<string, unknown> {
  const { visibility, state } = engine;
  const values = { ...visibility.conditionValues(state.values) };
  const kept = payload && engine.visibility.keep && keptValues(engine);
  if (kept)
    for (const { key } of visibility.allFields) {
      const field = visibility.fieldOf(key, state.values)!;
      if (kept[key] !== undefined) values[key] = isGroup(field) ? cleanItems(field, kept[key], {}, true) : trimValue(field, kept[key]);
    }
  for (const { key } of engine.visibility.groups) {
    const items = values[key];
    if (Array.isArray(items)) values[key] = items.map((item) => (isPlainEntry(item) ? { ...item } : item));
  }
  return withoutSkipped(engine, values);
}

export function resetEngine(engine: EngineInternals, values?: Record<string, unknown>): void {
  const previousValues = engine.state.values;
  const previousErrors = engine.errors;
  const loadingFields = Object.keys(engine.fieldLoading);
  baselineFields(engine);
  engine.validationEpoch++;
  engine.operationEpoch++;
  Object.assign(engine.state, initialState(createValues(engine.visibility.allFields, values, engine.visibility.activeField)));
  engine.skipped.clear();
  engine.visibility.reconcileHidden(engine.state.values, engine.errors, true);
  if (engine.viewedStep !== undefined) {
    emit(engine, { type: 'form_reset' });
    engine.viewedStep = null;
  }
  const changedValues = getChangedKeys(previousValues, engine.state.values);
  const changedFields = new Set([...changedValues, ...getChangedKeys(previousErrors, engine.errors), ...loadingFields]);
  engine.notify({
    fieldKeys: changedFields,
    structureChanged: true,
    valuesChanged: changedValues.size > 0,
  });
}
