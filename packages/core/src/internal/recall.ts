import type { FormEngine } from '../engine';
import { RECALL_SLOTS, recallEnabled, recallText } from '../engine/recall';
import type { EngineInternals } from '../engine/runtime-internals';

export function recalls(engine: FormEngine, node: object): boolean {
  const texts = node as Record<string, unknown>;
  return recallEnabled(engine.definition) && RECALL_SLOTS.some((slot) => String(texts[slot] ?? '').includes('{{'));
}

export function recalled<T extends object>(engine: FormEngine, node: T, path?: string): T {
  if (!recalls(engine, node)) return node;
  const parts = path ? (engine as unknown as EngineInternals).visibility.parse(path) : undefined;
  const item = parts && { group: parts[0], index: parts[1] };
  const values = engine.getSubmitValues();
  const result = { ...node } as Record<string, unknown>;
  for (const slot of RECALL_SLOTS)
    if (typeof result[slot] === 'string') result[slot] = recallText(engine.definition, result[slot] as string, values, item);
  return result as T;
}
