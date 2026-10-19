import { hasOptions, isScale, operatorsFor, scalePoints, takesValue, type BuilderQuestion, type ConditionRow } from '@formhaus/builder';

function firstValue(source: BuilderQuestion): string {
  if (hasOptions(source.type)) return source.options[0]?.value ?? '';
  return isScale(source.type) ? String(scalePoints(source)[0] ?? '') : '';
}

export function defaultRow(source: BuilderQuestion): ConditionRow {
  const operator = operatorsFor(source.type)[0] ?? 'notEmpty';
  return { field: source.key, operator, value: takesValue(operator) ? firstValue(source) : '' };
}
