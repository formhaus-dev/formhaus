import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import { RECALL_SLOTS, recallEnabled, recallText } from '../engine/recall';

export {
  cloudStateFor,
  createCloudController,
  initialCloudState,
  type CloudCallbacks,
  type CloudControllerOptions,
  type CloudState,
} from '../cloud/controller';
export { shouldApplyExternalErrors } from '../engine/external-errors';
export { labelFor } from '../i18n/labels';
export type { FormActionsState, FormActionsView } from '../types/views';
export { actionsView } from './actions';
export { warnDefinitionReset } from './definition-reset';
export { canMoveFocus, focusField, focusItem, focusProblem, restoreFocus } from './focus';
export { fieldDomId, itemDomId } from './ids';
export { errorDomId, errorGroups, itemHasContent, itemLimits, itemTitle, type ErrorEntry, type ErrorGroup } from './items';
export { warnMissingComponents } from './missing-components';
export {
  loadOptions,
  optionKey,
  optionSources,
  optionTexts,
  providedOptions,
  sameOptions,
  type OptionSource,
  type OptionsProvider,
} from './options';
export { applySources } from './sources';
export { scaleRange } from '../validation/type-checks';

export function conditionValues(engine: FormEngine): Record<string, unknown> {
  const internals = engine as unknown as EngineInternals;
  return internals.visibility.conditionValues(internals.values);
}

export function autoAdvance(engine: FormEngine): Promise<boolean> {
  return (engine as unknown as EngineInternals).advance('autoAdvance');
}

export function hasValue(engine: FormEngine, key: string): boolean {
  const internals = engine as unknown as EngineInternals;
  const path = internals.visibility.parse(key);
  const value = path ? (internals.values[path[0]] as Record<string, unknown>[] | undefined)?.[path[1]]?.[path[2]] : internals.values[key];
  return value !== undefined && value !== '';
}

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
