import type { FormAction } from '../types';
import { conditionsMet } from './evaluate-condition';

export function isActionDisabled(action: FormAction | false | undefined, values: Record<string, unknown>): boolean {
  return !!action && conditionsMet(action.disabled, values);
}
