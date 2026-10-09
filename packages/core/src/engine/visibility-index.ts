import type { FormField, FormStep } from '../types';
import { conditionFields } from './engine-utils';

export function indexConditions<T extends FormField | FormStep>(dependent: T, index: Map<string, Set<T>>): void {
  for (const field of conditionFields(dependent)) {
    const dependents = index.get(field) ?? new Set<T>();
    dependents.add(dependent);
    index.set(field, dependents);
  }
}
