import { hasOptions, operatorsFor, takesValue, type BuilderQuestion, type ConditionRow } from '@formhaus/builder';

export function defaultRow(source: BuilderQuestion): ConditionRow {
  const operator = operatorsFor(source.type)[0] ?? 'notEmpty';
  return { field: source.key, operator, value: takesValue(operator) && hasOptions(source.type) ? (source.options[0]?.value ?? '') : '' };
}
