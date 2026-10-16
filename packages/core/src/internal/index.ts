export {
  cloudStateFor,
  createCloudController,
  type CloudCallbacks,
  type CloudControllerOptions,
  type CloudState,
} from '../cloud/controller';
export { canMoveFocus, focusField, focusItem, focusProblem, restoreFocus } from './focus';
export { warnDefinitionReset } from './definition-reset';
export { warnMissingComponents } from './missing-components';
export { fieldDomId, itemDomId } from './ids';
export { errorDomId, errorEntries, itemHasContent, itemLimits, itemTitle, type ErrorEntry } from './items';
export { loadOptions, optionKey, optionSources, providedOptions, sameOptions, type OptionSource, type OptionsProvider } from './options';
export { shouldApplyExternalErrors } from '../engine/external-errors';
export { labelFor } from '../i18n/labels';
export { actionsView } from './actions';
import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';

export function conditionValues(engine: FormEngine): Record<string, unknown> {
  const internals = engine as unknown as EngineInternals;
  return internals.visibility.conditionValues(internals.values);
}

export function autoAdvance(engine: FormEngine): Promise<boolean> {
  return (engine as unknown as EngineInternals).advance('autoAdvance');
}
export { applySources } from './sources';
export type { FormActionsView } from '../types/views';
