import type { FormEngine } from '@formhaus/core';
import { recalled, ROOT_PROPS } from '@formhaus/core/internal';
import { useContext, useMemo } from 'react';
import { LabelContext } from './labels';
import { useRecallSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormProgressControllerProps {
  engine: FormEngine;
  ProgressComponent: FormRendererProps['progressComponent'];
  headingLevel: FormRendererProps['headingLevel'];
  marks?: boolean;
  slot: boolean;
}

export function FormProgressController({ engine, ProgressComponent, headingLevel, marks, slot }: FormProgressControllerProps) {
  const version = useRecallSnapshot(engine);
  const text = useContext(LabelContext);
  const errors = useMemo(() => (ProgressComponent && engine.isMultiStep ? engine.stepErrors : {}), [engine, version, ProgressComponent]);
  if (!engine.isMultiStep || !ProgressComponent) return null;
  const { current, total } = engine.progress;
  const step = engine.currentStep && recalled(engine, engine.currentStep);
  const errorsLabel = (count = 0) => (count ? text('stepErrors', { count }) : undefined);
  const steps = engine.visibleSteps.map((item) => ({
    id: item.id,
    title: recalled(engine, item).title,
    errorCount: errors[item.id]?.length ?? 0,
    errorsLabel: errorsLabel(errors[item.id]?.length),
  }));
  const stepErrorCount = errors[engine.currentStep?.id ?? '']?.length ?? 0;

  return (
    <ProgressComponent
      {...(slot
        ? { rootProps: ROOT_PROPS.progress, marks: !!marks, steps, stepErrorsLabel: errorsLabel(stepErrorCount) }
        : { steps: marks ? steps : undefined })}
      current={current}
      total={total}
      counterLabel={text('stepOf', { current, total })}
      stepTitle={step?.title}
      stepDescription={step?.description}
      headingLevel={headingLevel}
      stepErrorCount={stepErrorCount}
    />
  );
}
