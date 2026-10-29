import { engineSources, localeList, localizedTexts } from '../i18n/catalog';
import type { FormDefinition, FormField, FormGroup } from '../types';
import { messageResolver } from '../validation/default-messages';
import { markFileLists } from '../validation/type-checks';
import { hasOwn, isEntry, isGroup, keepId, valueFields } from '../visibility/nodes';
import { createValues, keptValues, valuesDiffer } from './engine-utils';
import { baselineFields, trackChanges } from './form-events';
import type { EngineInternals } from './runtime-internals';
import { reconcileStepIndex } from './step-routes';
import { createVisibility } from './visibility-state';
import { assertDefinition, warnUnordered, warnUntranslated } from './warnings';

export function loadDefinition(
  engine: EngineInternals,
  definition: FormDefinition,
  values: (fields: FormField[]) => Record<string, unknown> | undefined,
): void {
  assertDefinition(definition, engine.lifecycle, engine.validators);
  warnUnordered(definition, engine.lifecycle);
  const sources = localeList(engine.lifecycle.locale);
  warnUntranslated(sources, engine.lifecycle);
  const shown = localizedTexts(definition, sources);
  const visibility = createVisibility(shown, engine.lifecycle.hiddenValues === 'keep');
  markFileLists(shown, visibility.allFields);
  engine.source = definition;
  engine.definition = shown;
  engine.messages = messageResolver(engine.lifecycle.messages, ...engineSources(engine, 'messages'));
  engine.visibility = visibility;
  engine.state.values = createValues(visibility.allFields, values(visibility.allFields), visibility.activeField);
  visibility.reconcileHidden(engine.state.values, engine.state.errors, true);
  if (visibility.keep) engine.values;
}

const kept = (fields?: FormField[], field?: FormField) => !!fields?.some(({ key, type }) => key === field?.key && type === field.type);

export function replaceDefinition(engine: EngineInternals, definition: FormDefinition, textsOnly = false): void {
  const { state, skipped, values, currentStepIndex, visibility: previous } = engine;
  const errors = Object.keys(engine.errors);
  const steps = engine.visibleSteps;
  const items = (key: string) => previous.groups.find((group) => group.key === key)?.fields;
  baselineFields(engine);
  loadDefinition(engine, definition, (fields) => {
    const result: Record<string, unknown> = {};
    for (const field of fields) {
      let value = values[field.key];
      if (!kept(previous.allFields, field) || !hasOwn(values, field.key)) continue;
      if (isGroup(field) && Array.isArray(value)) {
        const old = items(field.key);
        const keep = ([key]: [string, unknown]) =>
          kept(
            old,
            field.fields.find((child) => child.key === key),
          );
        value = value.map((item) => (isEntry(item) ? keepId(item, Object.fromEntries(Object.entries(item).filter(keep))) : item));
      }
      result[field.key] = value;
    }
    return result;
  });
  const { visibility } = engine;
  if (!textsOnly) {
    engine.validationEpoch++;
    engine.operationEpoch++;
    state.stepValidating = false;
    if (engine.sending !== engine.latestOperation) state.submitting = false;
  }
  for (const key in state.errors) {
    const [group, , child] = visibility.parse(key) ?? [];
    const field = visibility.activeField(group ?? key, engine.state.values);
    if (
      !kept(previous.allFields, field) ||
      (group &&
        !kept(
          items(group),
          (field as FormGroup).fields.find(({ key }) => key === child),
        ))
    )
      delete state.errors[key];
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
  const valuesChanged = valuesDiffer(values, keptValues(engine));
  engine.notify({
    fieldKeys: [...previous.allFields.map(({ key }) => key), ...visibility.allFields.map(({ key }) => key), ...errors],
    structureChanged: true,
    valuesChanged,
  });
  if (!valuesChanged) trackChanges(engine, true);
}
