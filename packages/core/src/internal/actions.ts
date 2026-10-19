import type { FormEngine } from '../engine';
import { labelFor } from '../i18n/labels';
import type { LabelKey, LabelSource } from '../types';
import type { FormActionsState } from '../types/views';

export function actionsView(engine: FormEngine, labels?: LabelSource): FormActionsState {
  const { definition, isMultiStep, isFirstStep } = engine;
  const step = engine.currentStep;
  const isLastStep = engine.isLastStep || !isMultiStep;
  const label = (key: LabelKey) => labelFor(key, {}, labels, definition.labels);
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
    showBack: isMultiStep && !isFirstStep && step?.back !== false,
    backLabel: (step?.back || undefined)?.label ?? label('back'),
    showSkip: !!step?.skip && step.next !== false,
    skipLabel: step?.skip?.label ?? label('skip'),
  };
}
