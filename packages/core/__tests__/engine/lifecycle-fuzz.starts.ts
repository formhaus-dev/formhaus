import type { FormField, FormStep } from '../../src/types';

export function startModel(fields: FormField[], initial: Record<string, unknown>) {
  const last = new Map<string, unknown>();
  const hidden = new Set<string>();
  let starts: Record<string, unknown> = {};
  let skipped = false;
  const reset = (values?: Record<string, unknown>) => {
    starts = Object.fromEntries(fields.flatMap((field) => (field.defaultValue === undefined ? [] : [[field.key, field.defaultValue]])));
    Object.assign(starts, values);
    last.clear();
    skipped = false;
  };
  reset(initial);
  return {
    reset,
    set: (key: string, value: unknown) => last.set(key, value),
    skip: () => {
      skipped = true;
    },
    lost(field: FormField, step: FormStep | undefined, shown: boolean, value: unknown, error: unknown): string | undefined {
      const { key } = field;
      const unique = fields.filter((candidate) => candidate.key === key).length === 1;
      const remembered = field.type !== 'hidden' && last.has(key);
      const expected = remembered ? last.get(key) : starts[key];
      const returned = hidden.has(key);
      if (shown) hidden.delete(key);
      else hidden.add(key);
      if (shown && remembered) last.set(key, value);
      if (!shown || (skipped && step?.skip) || !unique || error !== undefined) return undefined;
      if (value === undefined && expected !== undefined) return `shown field ${key} lost its ${remembered ? 'last value' : 'start value'}`;
      if (returned && value !== undefined && typeof expected !== 'object' && !Object.is(value, expected))
        return `shown field ${key} came back as ${JSON.stringify(value)} instead of ${JSON.stringify(expected)}`;
      return undefined;
    },
  };
}
