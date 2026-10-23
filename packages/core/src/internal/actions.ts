import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import { getSubmitValues } from '../engine/validation-state';
import { engineLabel } from '../i18n/labels';
import { isActionDisabled } from '../visibility';
import type { LabelKey, LabelSource } from '../types';
import type { FormActionsState } from '../types/views';

export function actionValues(engine: FormEngine): Record<string, unknown> {
  return getSubmitValues(engine as unknown as EngineInternals);
}

export function actionsView(engine: FormEngine, labels?: LabelSource, values = actionValues(engine)): FormActionsState {
  const { definition, isMultiStep, isFirstStep } = engine;
  const step = engine.currentStep;
  const isLastStep = engine.isLastStep || !isMultiStep;
  const label = (key: LabelKey) => engineLabel(engine, key, {}, labels);
  return {
    submitAction: definition.submit,
    nextAction: step?.next,
    backAction: step?.back,
    cancelAction: definition.cancel,
    skipAction: step?.skip,
    isFirstStep,
    isLastStep,
    isMultiStep,
    primaryLabel: isLastStep ? (definition.submit?.label ?? label('submit')) : ((step?.next || undefined)?.label ?? label('continue')),
    showPrimary: isLastStep || step?.next !== false,
    primaryDisabled: isActionDisabled(isLastStep ? definition.submit : step?.next, values),
    showBack: isMultiStep && !isFirstStep && step?.back !== false,
    backLabel: (step?.back || undefined)?.label ?? label('back'),
    showSkip: !!step?.skip && step.next !== false,
    skipLabel: step?.skip?.label ?? label('skip'),
  };
}
