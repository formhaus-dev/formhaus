import type { ShowCondition } from '../types';

export function isBlank(value: unknown): boolean {
  return value == null || value === '' || (Array.isArray(value) && !value.length);
}

export function evaluateCondition(
  condition: ShowCondition,
  values: Record<string, unknown>,
): boolean {
  const value = values[condition.field];

  if (condition.eq !== undefined) {
    return value === condition.eq;
  }

  if (condition.neq !== undefined) {
    return value !== condition.neq;
  }

  if (condition.in !== undefined) {
    return condition.in.includes(value as string | number);
  }

  if (condition.notIn !== undefined) {
    return !condition.notIn.includes(value as string | number);
  }

  if (condition.notEmpty === true) {
    return !isBlank(value);
  }

  return true;
}
