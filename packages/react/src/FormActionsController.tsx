import type { FormEngine } from '@formhaus/core';
import { useCallback } from 'react';
import { useFormSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormActionsControllerProps {
  engine: FormEngine;
  definition: FormRendererProps['definition'];
  loading: boolean;
  ActionsComponent: FormRendererProps['ActionsComponent'];
  onSubmit: () => void;
  onNext: () => Promise<void>;
  onPrev: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function FormActionsController({
  engine,
  definition,
  loading,
  ActionsComponent,
  onSubmit,
  onNext,
  onPrev,
  onSkip,
  onCancel,
}: FormActionsControllerProps) {
  useFormSnapshot(engine);
  const step = engine.currentStep;
  const isLastStep = engine.isLastStep || !engine.isMultiStep;
  const primaryLabel = engine.isMultiStep && !isLastStep
    ? ((step?.next || undefined)?.label ?? 'Continue')
    : (definition.submit?.label ?? 'Submit');
  const showBack = engine.isMultiStep && !engine.isFirstStep && step?.back !== false;
  const backLabel = (step?.back || undefined)?.label ?? 'Back';
  const handlePrimary = useCallback(async () => {
    if (engine.isMultiStep && !isLastStep) await onNext();
    else onSubmit();
  }, [engine, isLastStep, onNext, onSubmit]);

  if (!ActionsComponent) return null;

  return (
    <ActionsComponent
      submitAction={definition.submit}
      backAction={step?.back}
      cancelAction={definition.cancel}
      skipAction={step?.skip}
      isFirstStep={engine.isFirstStep}
      isLastStep={isLastStep}
      isMultiStep={engine.isMultiStep}
      loading={loading || engine.stepValidating || engine.submitting}
      values={engine.values}
      onSubmit={onSubmit}
      onNext={onNext}
      onPrev={onPrev}
      onCancel={onCancel}
      onSkip={onSkip}
      primaryLabel={primaryLabel}
      showPrimary={isLastStep || step?.next !== false}
      showBack={showBack}
      backLabel={backLabel}
      showSkip={!!step?.skip && step.next !== false}
      onPrimary={handlePrimary}
    />
  );
}
