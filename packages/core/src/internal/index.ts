export {
  cloudStateFor,
  createCloudController,
  initialCloudState,
  type CloudCallbacks,
  type CloudControllerOptions,
  type CloudState,
} from '../cloud/controller';
export { canMoveFocus, focusField, focusProblem, restoreFocus } from './focus';
export { fieldDomId } from './ids';
export { shouldApplyExternalErrors } from '../engine/external-errors';
export { labelFor } from '../i18n/labels';
import type { FormEngine } from '../engine';
import { changeStep } from '../engine/navigation';
import type { EngineInternals } from '../engine/runtime-internals';

export function conditionValues(engine: FormEngine): Record<string, unknown> {
  const internals = engine as unknown as EngineInternals;
  return internals.visibility.conditionValues(internals.values);
}

export function autoAdvance(engine: FormEngine): Promise<boolean> {
  return changeStep(engine as unknown as EngineInternals, 'next', 'autoAdvance');
}
export { applySources, browserSources } from './sources';
