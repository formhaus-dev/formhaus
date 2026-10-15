import type { ShowCondition } from '../types';

export const CONDITION_OPERATORS = ['eq', 'neq', 'in', 'notIn', 'notEmpty', 'gt', 'gte', 'lt', 'lte'] as const;

export function isBlank(value: unknown): boolean {
  return value == null || value === '' || (Array.isArray(value) && !value.length);
}

function toNumber(value: unknown): number | undefined {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined;
}

function compare(value: unknown, operand: number, test: (value: number, operand: number) => boolean): boolean {
  const number = toNumber(value);
  return number !== undefined && test(number, operand);
}

export function evaluateCondition(condition: ShowCondition, values: Record<string, unknown>): boolean {
  const value = values[condition.field];
  if (condition.eq !== undefined) return value === condition.eq;
  if (condition.neq !== undefined) return value !== condition.neq;
  if (condition.in !== undefined) return condition.in.includes(value as string | number);
  if (condition.notIn !== undefined) return !condition.notIn.includes(value as string | number);
  if (condition.notEmpty !== undefined) return !condition.notEmpty || !isBlank(value);
  if (condition.gt !== undefined) return compare(value, condition.gt, (a, b) => a > b);
  if (condition.gte !== undefined) return compare(value, condition.gte, (a, b) => a >= b);
  if (condition.lt !== undefined) return compare(value, condition.lt, (a, b) => a < b);
  if (condition.lte !== undefined) return compare(value, condition.lte, (a, b) => a <= b);
  return false;
}
