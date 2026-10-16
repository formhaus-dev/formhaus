import type { FormEngine } from '@formhaus/core';
import { actionsView } from '@formhaus/core/internal';
import { useCallback, useMemo } from 'react';
import { useFormSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormActionsControllerProps {
  engine: FormEngine;
  loading: boolean;
  ActionsComponent: FormRendererProps['actionsComponent'];
  labels?: FormRendererProps['labels'];
  onSubmit: () => void;
  onNext: () => Promise<void>;
  onPrev: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

export function FormActionsController({
  engine,
  loading,
  ActionsComponent,
  labels,
  onSubmit,
  onNext,
  onPrev,
  onSkip,
  onCancel,
}: FormActionsControllerProps) {
  const version = useFormSnapshot(engine);
  const values = useMemo(() => engine.getSubmitValues(), [engine, version]);
  const view = actionsView(engine, labels);
  const handlePrimary = useCallback(async () => {
    if (view.isLastStep) onSubmit();
    else await onNext();
  }, [view.isLastStep, onNext, onSubmit]);

  if (!ActionsComponent) return null;

  return (
    <ActionsComponent
      {...view}
      loading={loading || engine.stepValidating || engine.submitting}
      values={values}
      onSubmit={onSubmit}
      onNext={onNext}
      onPrev={onPrev}
      onCancel={onCancel}
      onSkip={onSkip}
      onPrimary={handlePrimary}
    />
  );
}
