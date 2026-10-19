import type { FormDefinition } from '../types';
import { type ActiveField, type RecallOptions, resolveRecall } from './recall';
import { engineField } from './engine-field';
import { createVisibility, type VisibilityState } from './visibility-state';

export function recallText(definition: FormDefinition, text: string, values: Record<string, unknown>, options: RecallOptions = {}): string {
  let visibility: VisibilityState | undefined;
  const active: ActiveField = options.engine
    ? engineField(options.engine)
    : (key) => (visibility ??= createVisibility(definition)).activeField(key, values);
  return resolveRecall(definition, text, values, active, options);
}
