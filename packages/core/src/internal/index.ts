import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
export { autofilled } from './autofill';
export { recalled, recalls, recallVersion, refreshRecall, subscribeRecall } from './recall';
export { recallEnabled, recallKeys } from '../engine/recall';

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
export { fieldComponentsByName, mergeFieldComponents } from './field-components';
export { fieldDomId, itemDomId } from './ids';
export { errorDomId, errorGroups, itemHasContent, itemLimits, itemTitle, type ErrorEntry, type ErrorGroup } from './items';
export { warnMissingComponents } from './missing-components';
export {
  dividerBefore,
  imageSource,
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
