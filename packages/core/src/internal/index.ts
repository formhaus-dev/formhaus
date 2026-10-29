import type { FieldOption, FormField, FormSection, RootProps } from '../types';
import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
export { autofilled } from './autofill';
export { controlEntry } from './control-entry';
export { recalled, recalls, recallVersion, refreshRecall, subscribeRecall } from './recall';
export { recallEnabled, recallKeys } from '../engine/recall';

export { shouldApplyExternalErrors } from '../engine/external-errors';
export { engineLabel, labelFor } from '../i18n/labels';
export { actionsView, actionValues } from './actions';
export { warnDefinitionReset } from './definition-reset';
export { canMoveFocus, focusField, focusItem, focusProblem, restoreFocus } from './focus';
export { builtInFields, fieldComponentsByName, mergeFieldComponents } from './field-components';
export { fieldDomId, itemDomId } from './ids';
export { actionTestIds, fieldTestIds, testIds, type TestId, type TestIdOption } from './test-ids';
export { errorDomId, itemHasContent, itemLimits, itemTitle } from './items';
export { warnMissingComponents } from './missing-components';
export {
  dividerBefore,
  imageSource,
  loadOptions,
  optionSources,
  optionTexts,
  providedOptions,
  sameOptions,
  shownOptions,
  watchOptions,
  type OptionSource,
  type OptionsProvider,
} from './options';
export { optionKey } from '../visibility/nodes';
export { applySources } from './sources';
export { revealable, revealLayout, revealViews, type RevealSlot } from './reveal';
export { withReveals } from '../controls/options';
export { fileNames, nextRemove } from '../fields/files';
export { copyField } from '../validation/type-checks';

export function conditionValues(engine: FormEngine): Record<string, unknown> {
  const internals = engine as unknown as EngineInternals;
  return internals.visibility.conditionValues(internals.state.values);
}

export function autoAdvance(engine: FormEngine): Promise<boolean> {
  return (engine as unknown as EngineInternals).advance('autoAdvance');
}

export function hasValue(engine: FormEngine, key: string): boolean {
  const internals = engine as unknown as EngineInternals;
  const path = internals.visibility.parse(key);
  const value = path
    ? (internals.state.values[path[0]] as Record<string, unknown>[] | undefined)?.[path[1]]?.[path[2]]
    : internals.state.values[key];
  return value !== undefined && value !== '';
}

export function matrixColumns(section: FormSection): FieldOption[] | undefined {
  return section.layout === 'matrix' ? (section.fields[0] as FormField | undefined)?.options : undefined;
}

export const ROOT_PROPS = {
  fields: { 'data-fh': 'fields' },
  errorSummary: { 'data-fh': 'error-summary', role: 'alert', tabIndex: -1 },
  formErrors: { 'data-fh': 'form-errors', role: 'alert' },
  progress: { 'data-fh': 'progress' },
  actions: { 'data-fh': 'actions' },
} satisfies Record<string, RootProps>;

const noop = () => {};

export const CLOSED_DIALOG = { open: false, description: '', confirm: noop, cancel: noop };
