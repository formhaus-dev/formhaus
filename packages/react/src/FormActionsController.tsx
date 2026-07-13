import type { FormEngine } from '@formhaus/core';
import { useCallback } from 'react';
import { FormActions } from './FormActions';
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
  onCancel,
}: FormActionsControllerProps) {
  useFormSnapshot(engine);
  const Actions = ActionsComponent ?? FormActions;
  const isLastStep = engine.isLastStep || !engine.isMultiStep;
  const primaryLabel = engine.isMultiStep && !isLastStep
    ? (engine.currentStep?.next?.label ?? 'Continue')
    : (definition.submit?.label ?? 'Submit');
  const showBack = engine.isMultiStep && !engine.isFirstStep && engine.currentStep?.back !== false;
  const backLabel = typeof engine.currentStep?.back === 'object'
    ? (engine.currentStep.back.label ?? 'Back')
    : 'Back';
  const handlePrimary = useCallback(async () => {
    if (engine.isMultiStep && !isLastStep) await onNext();
    else onSubmit();
  }, [engine, isLastStep, onNext, onSubmit]);

  return (
    <Actions
      submitAction={definition.submit}
      backAction={engine.currentStep?.back}
      cancelAction={definition.cancel}
      isFirstStep={engine.isFirstStep}
      isLastStep={isLastStep}
      isMultiStep={engine.isMultiStep}
      loading={loading || engine.stepValidating}
      values={engine.values}
      onSubmit={onSubmit}
      onNext={onNext}
      onPrev={onPrev}
      onCancel={onCancel}
      primaryLabel={primaryLabel}
      showBack={showBack}
      backLabel={backLabel}
      onPrimary={handlePrimary}
    />
  );
}
