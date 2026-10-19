import type { FormDefinition } from '../types';
import { type RecallOptions, resolveRecall } from './recall';
import { createVisibility, type VisibilityState } from './visibility-state';

export function recallText(definition: FormDefinition, text: string, values: Record<string, unknown>, options?: RecallOptions): string {
  let visibility: VisibilityState | undefined;
  return resolveRecall(
    definition,
    text,
    values,
    (key, scope) => (visibility ??= createVisibility(definition)).activeField(key, scope),
    options,
  );
}
