import { isPlainEntry } from './type-checks';

type Values = Record<string, unknown>;

export const keysOf = (...objects: Values[]) => new Set(objects.flatMap((object) => Object.keys(object)));

export function sameValue(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') return a === b || (Number.isNaN(a) && Number.isNaN(b));
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => sameValue(item, b[index]));
  return (
    isPlainEntry(a) &&
    isPlainEntry(b) &&
    [...keysOf(a as Values, b as Values)].every((key) => sameValue((a as Values)[key], (b as Values)[key]))
  );
}
