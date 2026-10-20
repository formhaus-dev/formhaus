import type { FormField, FormStep } from '../types';
import { isVisible } from '../visibility';
import { hasOwn, isGroup } from '../visibility/nodes';
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
  const local = (field: FormField) =>
    only(field.key) === field &&
    !isGroup(field) &&
    !routeFields.has(field.key) &&
    !stepDependents.has(field.key) &&
    sources(field).every((key) => only(key) !== undefined);
  const dependents = (key: string) => [...(fieldDependents.get(key) ?? [])];

  const plan = (key: string): FormField[] | null => {
    const field = only(key);
    if (!field || !local(field)) return null;
    const affected = dependents(key);
    return affected.every(local) ? [field, ...affected] : null;
  };

  return (key: string, values: Values, active: Values, positions: Map<FormStep, number>): PathChange[] | undefined => {
    const at = (field: FormField) => {
      const step = stepOfField.get(field);
      return step ? (positions.get(step) ?? -1) : 0;
    };
    if (fieldsByKey.get(key)?.every((field) => at(field) < 0)) return [];
    if (fieldsByKey.has(key) && !plans.has(key)) plans.set(key, plan(key));
    const fields = plans.get(key);
    if (!fields) return undefined;
    const changes = new Map<string, PathChange>();
    const pending = new Map<number, Set<FormField>>();
    const enqueue = (field: FormField) => {
      const position = at(field);
      if (position >= 0) pending.set(position, (pending.get(position) ?? new Set()).add(field));
    };
    const read = (source: string) => (changes.has(source) ? changes.get(source)![2] : active[source]);
    for (const field of fields) enqueue(field);
    while (pending.size) {
      const position = Math.min(...pending.keys());
      const batch = pending.get(position)!;
      pending.delete(position);
      for (const field of batch) {
        const step = stepOfField.get(field);
        const scope: Values = {};
        for (const source of sources(field)) {
          const owner = only(source)!;
          const before = at(owner);
          if (stepOfField.get(owner) === step) scope[source] = trimValue(owner, values[source]);
          else scope[source] = before >= 0 && before < position ? read(source) : undefined;
        }
        const section = sectionOf.get(field);
        const shown = values[field.key] !== undefined && (!section || isVisible(section, scope)) && isVisible(field, scope);
        const value = shown ? trimValue(field, values[field.key]) : undefined;
        const previous = changes.get(field.key) ?? [field.key, hasOwn(active, field.key), active[field.key]];
        changes.set(field.key, [field.key, shown, value]);
        if (previous[1] === shown && Object.is(previous[2], value)) continue;
        for (const dependent of dependents(field.key)) {
          if (at(dependent) <= position) continue;
          if (!local(dependent)) return undefined;
          enqueue(dependent);
        }
      }
    }
    return [...changes.values()];
  };
}
