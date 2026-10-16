import type { FormField, FormStep } from '../types';
import { isVisible } from '../visibility';
import { isGroup } from '../visibility/nodes';
import { trimValue } from '../validation/type-checks';
import type { DefinitionIndex } from './visibility-index';

type Values = Record<string, unknown>;

type PathChange = readonly [key: string, shown: boolean, value: unknown];

export function createPathPatch({
  fieldsByKey,
  fieldDependents,
  routeFields,
  stepDependents,
  stepOfField,
  sectionOf,
  conditionSources: sources,
}: DefinitionIndex) {
  const plans = new Map<string, FormField[] | null>();
  const only = (key: string) => {
    const fields = fieldsByKey.get(key);
    return fields?.length === 1 ? fields[0] : undefined;
  };
  const local = (field: FormField, step: FormStep | undefined) =>
    only(field.key) === field &&
    !isGroup(field) &&
    stepOfField.get(field) === step &&
    !routeFields.has(field.key) &&
    !stepDependents.has(field.key) &&
    sources(field).every((key) => only(key) !== undefined);
  const dependents = (key: string) => [...(fieldDependents.get(key) ?? [])];

  const plan = (key: string): FormField[] | null => {
    const field = only(key);
    const step = field && stepOfField.get(field);
    if (!field || !local(field, step)) return null;
    const affected = dependents(key);
    const contained = affected.every(
      (dependent) => local(dependent, step) && dependents(dependent.key).every((next) => stepOfField.get(next) === step),
    );
    return contained ? [field, ...affected] : null;
  };

  return (key: string, values: Values, active: Values, steps: FormStep[]): PathChange[] | undefined => {
    if (fieldsByKey.has(key) && !plans.has(key)) plans.set(key, plan(key));
    const fields = plans.get(key);
    if (!fields) return undefined;
    const step = stepOfField.get(fields[0]);
    if (step && !steps.includes(step)) return [];
    return fields.map((field) => {
      const scope: Values = {};
      for (const source of sources(field)) {
        const owner = only(source)!;
        scope[source] = stepOfField.get(owner) === step ? trimValue(owner, values[source]) : active[source];
      }
      const section = sectionOf.get(field);
      const shown = values[field.key] !== undefined && (!section || isVisible(section, scope)) && isVisible(field, scope);
      return [field.key, shown, shown ? trimValue(field, values[field.key]) : undefined] as const;
    });
  };
}
