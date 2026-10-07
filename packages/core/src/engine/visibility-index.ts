import type { FormField, FormStep } from '../types';

export function indexConditions<T extends FormField | FormStep>(
  dependent: T,
  show: T['show'],
  showAny: T['showAny'],
  index: Map<string, Set<T>>,
): void {
  for (const condition of [...(show ?? []), ...(showAny ?? [])]) {
    const dependents = index.get(condition.field) ?? new Set<T>();
    dependents.add(dependent);
    index.set(condition.field, dependents);
  }
}
