import type { FormEngine } from '@formhaus/core';
import { actionTestIds, actionValues, actionsView, ROOT_PROPS, type TestId } from '@formhaus/core/internal';
import { useCallback, useMemo } from 'react';
import { useFormSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormActionsControllerProps {
  engine: FormEngine;
  loading: boolean;
  ActionsComponent: FormRendererProps['actionsComponent'];
  slot: boolean;
  labels?: FormRendererProps['labels'];
  onSubmit: () => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
  onCancel: () => void;
  testId?: TestId;
}

export function FormActionsController({
  engine,
  loading,
  ActionsComponent,
  slot,
  labels,
  onSubmit,
  onNext,
  onBack,
  onSkip,
  onCancel,
  testId,
}: FormActionsControllerProps) {
  const version = useFormSnapshot(engine);
  const values = useMemo(() => actionValues(engine), [engine, version]);
  const view = actionsView(engine, labels);
  const handlePrimary = useCallback(async () => {
    if (view.isLastStep) onSubmit();
    else await onNext();
  }, [view.isLastStep, onNext, onSubmit]);

  if (!ActionsComponent) return null;

  return (
    <ActionsComponent
      {...(slot && { rootProps: ROOT_PROPS.actions })}
      {...view}
      loading={loading}
      values={values}
      onSubmit={onSubmit}
      onNext={onNext}
      onBack={onBack}
      onCancel={onCancel}
      onSkip={onSkip}
      onPrimary={handlePrimary}
      testIds={actionTestIds(testId)}
    />
  );
}
