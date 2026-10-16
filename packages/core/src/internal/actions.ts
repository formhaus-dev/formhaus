import type { FormEngine } from '../engine';
import { labelFor } from '../i18n/labels';
import type { LabelSource } from '../types';
import type { FormActionsView } from '../types/views';

export function actionsView(engine: FormEngine, labels?: LabelSource): FormActionsView {
  const { definition, isMultiStep, isFirstStep } = engine;
  const step = engine.currentStep;
  const isLastStep = engine.isLastStep || !isMultiStep;
  return {
    submitAction: definition.submit,
    nextAction: step?.next,
    backAction: step?.back,
    cancelAction: definition.cancel,
    skipAction: step?.skip,
    isFirstStep,
    isLastStep,
    isMultiStep,
    primaryLabel: isLastStep
      ? (definition.submit?.label ?? 'Submit')
      : ((step?.next || undefined)?.label ?? labelFor('continue', {}, labels, definition.labels)),
    showPrimary: isLastStep || step?.next !== false,
    showBack: isMultiStep && !isFirstStep && step?.back !== false,
    backLabel: (step?.back || undefined)?.label ?? labelFor('back', {}, labels, definition.labels),
    showSkip: !!step?.skip && step.next !== false,
  };
}
