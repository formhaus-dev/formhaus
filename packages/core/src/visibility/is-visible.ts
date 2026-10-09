import type { FormField, ShowCondition } from '../types';
import { evaluateCondition } from './evaluate-condition';

export function isVisible(
  field: Pick<FormField, 'show' | 'showAny'>,
  values: Record<string, unknown>,
): boolean {
  const matches = (condition: ShowCondition) => evaluateCondition(condition, values);
  return (field.show ?? []).every(matches) && (!field.showAny?.length || field.showAny.some(matches));
}
