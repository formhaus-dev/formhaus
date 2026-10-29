import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import type { LabelKey, LabelSource } from '../types';
import { resolveText } from '../validation/default-messages';
import { engineSources } from './catalog';
import { DEFAULT_LABELS } from './nodes';

export function labelFor(key: LabelKey, params: Record<string, unknown>, ...sources: (LabelSource | undefined)[]): string {
  return resolveText(DEFAULT_LABELS, key, params, sources);
}

export function engineLabel(engine: FormEngine, key: LabelKey, params: Record<string, unknown>, labels?: LabelSource): string {
  return labelFor(key, params, labels, ...engineSources(engine as unknown as EngineInternals, 'labels'));
}
