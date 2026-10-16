import type { EngineInternals } from './runtime-internals';
import { reconcileStepIndex } from './step-routes';
import { clearError, clearResolvedMatchErrors, dropServerErrors, pruneOffPathErrors } from './validation-state';

export function writeValue(
  engine: EngineInternals,
  key: string,
  value: unknown,
  own = true,
  changed: () => Iterable<string> = () => [],
): void {
  const { values, errors } = engine.state;
  const previousSteps = engine.isMultiStep ? engine.visibleSteps : null;
  const valueChanged = !Object.is(values[key], value);
  const previousError = errors[key];
  values[key] = value;
  if (valueChanged) engine.visibility.markEdited(key);
  if (own) clearError(engine, key, valueChanged);
  for (const [stepId, keys] of engine.skipped) if (valueChanged && keys.includes(key)) engine.skipped.delete(stepId);
  const clearedFields = engine.visibility.reconcileHidden(values, errors);
  dropServerErrors(engine, clearedFields);
  const changedFields = new Set([...clearedFields, ...clearResolvedMatchErrors(engine, key), ...changed()]);
  if (valueChanged || previousError !== errors[key]) changedFields.add(key);
  const valuesChanged = valueChanged || clearedFields.size > 0;
  const structureChanged = valuesChanged && engine.visibility.affectsStructure(key, clearedFields);
  if (previousSteps && structureChanged) {
    engine.visibility.markChanged(true, true);
    engine.state.currentStepIndex = reconcileStepIndex(previousSteps, engine.visibleSteps, engine.currentStepIndex);
    for (const pruned of pruneOffPathErrors(engine)) changedFields.add(pruned);
  }
  engine.notify({ fieldKeys: changedFields, structureChanged, valuesChanged });
}
