import type { FieldOption } from '../types';
import { RANDOMIZED_TYPES } from '../validation/type-checks';
import { optionKey } from '../visibility/nodes';
import { hex } from '../internal/hash';
import type { EngineInternals } from './runtime-internals';

export function randomSeed(): string {
  const bytes = Uint8Array.from({ length: 16 }, () => Math.random() * 256);
  try {
    crypto.getRandomValues(bytes);
  } catch {}
  return hex(bytes);
}

export function optionOrder(seed: string, key: string, pinned: boolean[]): number[] {
  const text = `${seed}\u001f${key}`;
  let state = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) state = Math.imul(state ^ text.charCodeAt(index), 0x01000193) >>> 0;
  const order = pinned.map((_, index) => index);
  const slots = order.filter((index) => !pinned[index]);
  for (let i = slots.length - 1; i > 0; i--) {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const j = slots[((t ^ (t >>> 14)) >>> 0) % (i + 1)];
    [order[slots[i]], order[j]] = [order[j], order[slots[i]]];
  }
  return order;
}

export function orderOptions(engine: EngineInternals, key: string, options?: FieldOption[]): FieldOption[] {
  const { visibility, values } = engine;
  const [group, , child] = visibility.parse(key) ?? [];
  const name = group ? optionKey(group, child!) : key;
  const field =
    visibility.fieldOf(name, values) ??
    visibility.groups.flatMap(({ key, fields }) => fields.filter((item) => optionKey(key, item.key) === name))[0];
  const source = options ?? field?.options ?? [];
  if (!field?.randomize || !RANDOMIZED_TYPES.includes(field.type) || visibility.sectionOf.get(field)?.layout === 'matrix') return source;
  return optionOrder(
    engine.seed,
    name,
    source.map((option) => !!(option.pinned || option.exclusive)),
  ).map((index) => source[index]);
}
