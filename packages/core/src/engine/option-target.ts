import type { FieldOption } from '../types';
import { RANDOMIZED_TYPES } from '../validation/type-checks';
import { optionKey } from '../visibility/nodes';
import type { EngineInternals } from './runtime-internals';

export function orderOptions(engine: EngineInternals, key: string, options?: FieldOption[]): FieldOption[] {
  const { visibility, values, seed, lifecycle } = engine;
  const [group, , child] = visibility.parse(key) ?? [];
  const name = group ? optionKey(group, child!) : key;
  const field =
    visibility.fieldOf(name, values) ??
    visibility.groups.flatMap((owner) =>
      visibility.fieldOf(owner.key, values) === owner ? owner.fields.filter((item) => optionKey(owner.key, item.key) === name) : [],
    )[0];
  const source = options ?? field?.options ?? [];
  return lifecycle.research &&
    field?.randomize &&
    RANDOMIZED_TYPES.includes(field.type) &&
    visibility.sectionOf.get(field)?.layout !== 'matrix'
    ? lifecycle.research.order(seed, name, source)
    : source;
}
