import type { ShowCondition } from '../types';

export const CONDITION_OPERATORS = ['eq', 'neq', 'in', 'notIn', 'notEmpty', 'gt', 'gte', 'lt', 'lte'] as const;

export function isBlank(value: unknown): boolean {
  return value == null || value === '' || (Array.isArray(value) && !value.length);
}

function toNumber(value: unknown): number | undefined {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : undefined;
}

type Operands = Required<Omit<ShowCondition, 'field'>>;

const TESTS: { [K in keyof Operands]: (value: unknown, operand: Operands[K]) => boolean } = {
  eq: (value, operand) => value === operand,
  neq: (value, operand) => value !== operand,
  in: (value, operand) => operand.includes(value as string | number),
  notIn: (value, operand) => !operand.includes(value as string | number),
  notEmpty: (value, operand) => !operand || !isBlank(value),
  gt: (value, operand) => toNumber(value)! > operand,
  gte: (value, operand) => toNumber(value)! >= operand,
  lt: (value, operand) => toNumber(value)! < operand,
  lte: (value, operand) => toNumber(value)! <= operand,
};

export function evaluateCondition(condition: ShowCondition, values: Record<string, unknown>): boolean {
  const value = values[condition.field];
  const operator = CONDITION_OPERATORS.find((name) => condition[name] !== undefined);
  return !!operator && (TESTS[operator] as (value: unknown, operand: unknown) => boolean)(value, condition[operator]);
}
