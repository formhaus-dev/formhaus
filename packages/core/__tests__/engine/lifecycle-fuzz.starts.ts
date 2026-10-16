import type { FormField, FormStep } from '../../src/types';
import { isGroup } from '../../src/visibility';

export function startModel(fields: FormField[], initial: Record<string, unknown>) {
  const edited = new Set<string>();
  let starts: Record<string, unknown> = {};
  let skipped = false;
  const reset = (values?: Record<string, unknown>) => {
    starts = Object.fromEntries(fields.flatMap((field) => (field.defaultValue === undefined ? [] : [[field.key, field.defaultValue]])));
    Object.assign(starts, values);
    edited.clear();
    skipped = false;
  };
  reset(initial);
  return {
    reset,
    edit: (key: string) => edited.add(key),
    skip: () => {
      skipped = true;
    },
    lost(field: FormField, step: FormStep | undefined, value: unknown, error: unknown): string | undefined {
      const fresh = field.type === 'hidden' || !edited.has(field.key);
      const restorable = (fresh && starts[field.key] !== undefined) || (!fresh && isGroup(field) && field.defaultItems! > 0);
      const unique = fields.filter(({ key }) => key === field.key).length === 1;
      if (!restorable || (skipped && step?.skip) || !unique || value !== undefined || error !== undefined) return undefined;
      return `shown field ${field.key} lost its ${fresh ? 'start value' : 'default items'}`;
    },
  };
}
