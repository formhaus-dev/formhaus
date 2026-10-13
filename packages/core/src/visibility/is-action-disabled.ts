import type { FormAction } from '../types';
import { evaluateCondition } from './evaluate-condition';

export function isActionDisabled(action: FormAction | false | undefined, values: Record<string, unknown>): boolean {
  return !!action && !!action.disabled?.length && action.disabled.every((condition) => evaluateCondition(condition, values));
}
