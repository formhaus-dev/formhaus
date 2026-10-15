import type { FormField, FormStep, ShowCondition } from '../types';
import { conditionFields } from '../visibility/nodes';

type Conditional = { show?: ShowCondition[]; showAny?: ShowCondition[] };

export function indexConditions<T extends FormField | FormStep>(
  dependent: T,
  index: Map<string, Set<T>>,
  source: Conditional = dependent,
): void {
  for (const field of conditionFields(source)) {
    const dependents = index.get(field) ?? new Set<T>();
    dependents.add(dependent);
    index.set(field, dependents);
  }
}
