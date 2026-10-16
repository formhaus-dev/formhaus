import type { FormDefinition, FormField, FormSection, FormStep, ShowCondition } from '../types';
import { conditionFields, isGroup, isSection, topNodes, valueFields } from '../visibility/nodes';
import { getAllFields } from './engine-utils';

type Conditional = { show?: ShowCondition[]; showAny?: ShowCondition[] };

export function indexConditions<T extends FormField | FormStep>(
  dependent: T,
  index: Map<string, Set<T>>,
  source: Conditional = dependent,
): void {
  for (const field of conditionFields(source)) {
    const dependents = index.get(field) ?? new Set<T>();
    dependents.add(dependent);
    index.set(field, dependents);
  }
}

export type DefinitionIndex = ReturnType<typeof indexDefinition>;

export function indexDefinition(definition: FormDefinition) {
  const allFields = getAllFields(definition);
  const fieldsByKey = new Map<string, FormField[]>();
  const routeFields = new Set<string>();
  const fieldDependents = new Map<string, Set<FormField>>();
  const stepDependents = new Map<string, Set<FormStep>>();
  const stepOfField = new Map<FormField, FormStep>();
  const sectionOf = new Map<FormField, FormSection>();

  for (const node of topNodes(definition)) if (isSection(node)) for (const field of node.fields) sectionOf.set(field, node);
  for (const field of allFields) {
    const same = fieldsByKey.get(field.key);
    if (same) same.push(field);
    else fieldsByKey.set(field.key, [field]);
    indexConditions(field, fieldDependents);
    const section = sectionOf.get(field);
    if (section) indexConditions(field, fieldDependents, section);
    if (isGroup(field)) for (const item of field.fields) indexConditions<FormField>(field, fieldDependents, item);
  }
  for (const step of definition.steps ?? []) {
    for (const field of valueFields(step.fields)) stepOfField.set(field, step);
    indexConditions(step, stepDependents);
    for (const route of step.routes ?? []) for (const key of conditionFields(route)) routeFields.add(key);
  }
  const conditionSources = (field: FormField) =>
    [field, sectionOf.get(field), stepOfField.get(field), ...(isGroup(field) ? field.fields : [])].flatMap((source) =>
      source ? conditionFields(source) : [],
    );
  return { allFields, fieldsByKey, routeFields, fieldDependents, stepDependents, stepOfField, sectionOf, conditionSources };
}
