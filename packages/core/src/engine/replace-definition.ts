import type { FormDefinition } from '../types';
import { hasOwn, valueFields } from '../visibility/nodes';
import { baselineFields } from './form-events';
import type { EngineInternals } from './runtime-internals';
import { reconcileStepIndex } from './step-routes';

export function replaceDefinition(engine: EngineInternals, definition: FormDefinition): void {
  const { state, skipped, values, currentStepIndex } = engine;
  const errors = Object.keys(engine.errors);
  const steps = engine.visibleSteps;
  const types = new Map(engine.visibility.allFields.map((field) => [field.key, field.type]));
  baselineFields(engine);
  engine.load(definition, (fields) => {
    const kept: Record<string, unknown> = {};
    for (const { key, type } of fields) if (types.get(key) === type && hasOwn(values, key)) kept[key] = values[key];
    return kept;
  });
  const { visibility } = engine;
  engine.validationEpoch++;
  engine.operationEpoch++;
  state.stepValidating = state.submitting = false;
  for (const key in state.errors) {
    const field = visibility.activeField(visibility.owner(key), engine.values);
    if (!field || types.get(field.key) !== field.type) delete state.errors[key];
  }
  for (const key in state.serverErrors) if (!hasOwn(state.errors, key)) delete state.serverErrors[key];
  state.currentStepIndex = reconcileStepIndex(steps, engine.visibleSteps, currentStepIndex);
  skipped.forEach((_, id) => {
    const step = definition.steps?.find((step) => step.id === id);
    if (step)
      skipped.set(
        id,
        valueFields(step.fields).map(({ key }) => key),
      );
    else skipped.delete(id);
  });
  engine.notify({
    fieldKeys: [...types.keys(), ...visibility.allFields.map(({ key }) => key), ...errors],
    structureChanged: true,
    valuesChanged: true,
  });
}
