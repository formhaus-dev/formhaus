import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';

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
export { errorDomId, errorEntries, itemHasContent, itemLimits, itemTitle, type ErrorEntry } from './items';
export { warnMissingComponents } from './missing-components';
export { loadOptions, optionKey, optionSources, providedOptions, sameOptions, type OptionSource, type OptionsProvider } from './options';
export { applySources } from './sources';

export function conditionValues(engine: FormEngine): Record<string, unknown> {
  const internals = engine as unknown as EngineInternals;
  return internals.visibility.conditionValues(internals.values);
}

export function autoAdvance(engine: FormEngine): Promise<boolean> {
  return (engine as unknown as EngineInternals).advance('autoAdvance');
}
