import { evaluateCondition } from '@formhaus/core';
import type { FormAction } from '@formhaus/core';

export function isActionDisabled(
  action: FormAction | undefined,
  values: Record<string, unknown>,
  loading?: boolean,
): boolean {
  if (loading) return true;
  if (!action?.disabled || action.disabled.length === 0) return false;
  return action.disabled.every((c) => evaluateCondition(c, values));
}
