import { isSection, type FormAction, type FormDefinition, type FormField, type ShowCondition } from '@formhaus/core';
import { deepFields } from '../../nodes';

interface Conditional {
  show?: ShowCondition[];
  showAny?: ShowCondition[];
}

function allFields(draft: FormDefinition): FormField[] {
  return deepFields([...(draft.fields ?? []), ...(draft.steps ?? []).flatMap((step) => step.fields)]);
}

function conditions(draft: FormDefinition): ShowCondition[] {
  const owners: Conditional[] = [
    ...allFields(draft),
    ...[...(draft.fields ?? []), ...(draft.steps ?? []).flatMap((step) => step.fields)].filter(isSection),
    ...(draft.steps ?? []),
    ...(draft.steps ?? []).flatMap((step) => step.routes ?? []),
  ];
  const actions = [draft.submit, draft.cancel, ...(draft.steps ?? []).flatMap((step) => [step.next, step.back])].filter(
    (action): action is FormAction => Boolean(action),
  );
  return [
    ...owners.flatMap((owner) => [...(owner.show ?? []), ...(owner.showAny ?? [])]),
    ...actions.flatMap((action) => action.disabled ?? []),
  ];
}

export function referencedKeys(draft: FormDefinition): Set<string> {
  const keys = new Set(conditions(draft).map((condition) => condition.field));
  for (const field of allFields(draft)) {
    if (field.validation?.matchField) keys.add(field.validation.matchField);
    for (const key of field.optionsDependsOn ?? []) keys.add(key);
  }
  return keys;
}

export function referencedValues(draft: FormDefinition, key: string): Set<string> {
  const values = new Set<string>();
  for (const condition of conditions(draft).filter((item) => item.field === key)) {
    for (const value of [
      condition.eq,
      condition.neq,
      condition.contains,
      condition.notContains,
      ...(condition.in ?? []),
      ...(condition.notIn ?? []),
    ]) {
      if (value !== undefined) values.add(String(value));
    }
  }
  const field = allFields(draft).find((item) => item.key === key);
  const defaults = field?.defaultValue === undefined ? [] : [field.defaultValue].flat();
  for (const value of defaults) values.add(String(value));
  return values;
}

export function referencedSteps(draft: FormDefinition): Set<string> {
  return new Set(
    (draft.steps ?? [])
      .flatMap((step) => step.routes ?? [])
      .map((route) => route.to)
      .filter((to): to is string => Boolean(to)),
  );
}
