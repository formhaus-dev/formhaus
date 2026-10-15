export { cloudStateFor, createCloudController, initialCloudState, type CloudCallbacks, type CloudControllerOptions, type CloudState } from '../cloud/controller';
export { focusProblem } from '../cloud/focus';
export { shouldApplyExternalErrors } from '../engine/external-errors';
export { labelFor } from '../i18n/labels';
import type { FormEngine } from '../engine';
import { changeStep } from '../engine/navigation';
import type { EngineInternals } from '../engine/runtime-internals';

export function autoAdvance(engine: FormEngine): Promise<boolean> {
  return changeStep(engine as unknown as EngineInternals, 'next', 'autoAdvance');
}

const clean = (value: string) => value.replace(/[^A-Za-z0-9_-]/g, '-');

export function fieldDomId(formId: string | undefined, key: string): string {
  return `${formId ? clean(formId) : 'fh'}-${clean(key)}`;
}
