import type { FormEngine } from '../engine';
import { RECALL_SLOTS, type RecallItem, recallEnabled, resolveRecall } from '../engine/recall';
import type { EngineInternals } from '../engine/runtime-internals';
import { engineField } from '../engine/engine-field';
import { getSubmitValues } from '../engine/validation-state';

const internals = (engine: FormEngine) => engine as unknown as EngineInternals;

export function recalls(engine: FormEngine, node: object): boolean {
  const texts = node as Record<string, unknown>;
  return recallEnabled(engine.definition) && RECALL_SLOTS.some((slot) => String(texts[slot] ?? '').includes('{{'));
}

const channels = new WeakMap<FormEngine, { version: number; listeners: Set<() => void> }>();
const channel = (engine: FormEngine) => channels.get(engine) ?? channels.set(engine, { version: 0, listeners: new Set() }).get(engine)!;

export function subscribeRecall(engine: FormEngine, listener: () => void): () => void {
  const { listeners } = channel(engine);
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const recallVersion = (engine: FormEngine): number => channel(engine).version;

export function refreshRecall(engine: FormEngine): void {
  if (!recallEnabled(engine.definition)) return;
  const state = channel(engine);
  state.version++;
  for (const listener of state.listeners) listener();
}

function resolver(engine: FormEngine, item?: RecallItem) {
  const { lifecycle } = internals(engine);
  const values = getSubmitValues(internals(engine));
  return (text: string, params?: Record<string, unknown>) =>
    resolveRecall(
      engine.definition,
      text,
      values,
      engineField(engine),
      { item, lang: lifecycle.lang, format: lifecycle.formatRecall },
      params,
    );
}

export function recallTemplate(engine: FormEngine, text: string, item: RecallItem, params: Record<string, unknown>): string {
  return resolver(engine, item)(text, params);
}

export function recalled<T extends object>(engine: FormEngine, node: T, at?: string | RecallItem): T {
  if (!recalls(engine, node)) return node;
  const parts = typeof at === 'string' ? internals(engine).visibility.parse(at) : undefined;
  const item = parts ? { group: parts[0], index: parts[1] } : (at as RecallItem | undefined);
  const resolve = resolver(engine, item);
  const result = { ...node } as Record<string, unknown>;
  for (const slot of RECALL_SLOTS) if (typeof result[slot] === 'string') result[slot] = resolve(result[slot] as string);
  return result as T;
}
