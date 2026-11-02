import type { FormEngine } from '../engine';
import { isActionDisabled } from '../visibility';
import { actionValues } from './actions';

type EngineSource = FormEngine | { readonly engine: FormEngine | undefined } | null | undefined;

export const engineOf = (source: EngineSource): FormEngine | undefined =>
  (source && 'engine' in source ? source.engine : source) ?? undefined;

export function submitState(engine: FormEngine | undefined): { submitting: boolean; validating: boolean; canSubmit: boolean } {
  const submitting = !!engine?.submitting;
  const validating = !!engine?.stepValidating;
  return {
    submitting,
    validating,
    canSubmit:
      !!engine &&
      (engine.isLastStep || !engine.isMultiStep) &&
      !submitting &&
      !validating &&
      !isActionDisabled(engine.definition.submit, actionValues(engine)),
  };
}
