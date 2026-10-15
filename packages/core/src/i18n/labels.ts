import type { LabelKey, LabelSource } from '../types';
import { resolveText } from '../validation/default-messages';
import { DEFAULT_LABELS } from './nodes';

export function labelFor(key: LabelKey, params: Record<string, unknown>, ...sources: (LabelSource | undefined)[]): string {
  return resolveText(DEFAULT_LABELS, key, params, sources);
}
