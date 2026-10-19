import type { FormField } from '../types';
import { exclusiveValues } from '../validation/type-checks';

export function exclusiveWrite(field: FormField | undefined, previous: unknown, next: unknown): unknown {
  const exclusive = field && Array.isArray(next) ? exclusiveValues(field) : [];
  if (!exclusive.length) return next;
  const before = Array.isArray(previous) ? previous : [];
  const picked = (next as unknown[]).filter((value) => exclusive.includes(value) && !before.includes(value));
  if (picked.length) return picked.slice(-1);
  const rest = (next as unknown[]).filter((value) => !exclusive.includes(value));
  return rest.length && rest.length < (next as unknown[]).length ? rest : next;
}
