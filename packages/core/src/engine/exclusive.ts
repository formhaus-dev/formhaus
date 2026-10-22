import type { FormField } from '../types';
import { exclusiveValues } from '../validation/type-checks';
import { itemsOf } from '../visibility/nodes';

export function exclusiveWrite(field: FormField | undefined, previous: unknown, next: unknown): unknown {
  const exclusive = field && Array.isArray(next) ? exclusiveValues(field) : [];
  if (!exclusive.length) return next;
  const before = itemsOf(previous);
  const added = (next as unknown[]).filter((value) => !before.includes(value));
  const picked = added.filter((value) => exclusive.includes(value));
  if (picked.length) return picked.slice(-1);
  const rest = (next as unknown[]).filter((value) => !exclusive.includes(value));
  return added.length && rest.length < (next as unknown[]).length ? rest : next;
}
