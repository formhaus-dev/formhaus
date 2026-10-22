import type { FormEngine } from '@formhaus/core';
import { recalled } from '@formhaus/core/internal';
import { useContext, useMemo } from 'react';
import { LabelContext } from './labels';
import { useRecallSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormProgressControllerProps {
  engine: FormEngine;
  ProgressComponent: FormRendererProps['progressComponent'];
  headingLevel: FormRendererProps['headingLevel'];
  marks?: boolean;
}

export function FormProgressController({ engine, ProgressComponent, headingLevel, marks }: FormProgressControllerProps) {
  const version = useRecallSnapshot(engine);
  const text = useContext(LabelContext);
  const errors = useMemo(() => (ProgressComponent && engine.isMultiStep ? engine.stepErrors : {}), [engine, version, ProgressComponent]);
  if (!engine.isMultiStep || !ProgressComponent) return null;
  const { current, total } = engine.progress;
  const step = engine.currentStep && recalled(engine, engine.currentStep);

  return (
    <ProgressComponent
      current={current}
      total={total}
      counterLabel={text('stepOf', { current, total })}
      stepTitle={step?.title}
      stepDescription={step?.description}
      headingLevel={headingLevel}
      stepErrorCount={errors[engine.currentStep?.id ?? '']?.length ?? 0}
      steps={
        marks
          ? engine.visibleSteps.map((item) => ({
              id: item.id,
              title: recalled(engine, item).title,
              errorCount: errors[item.id]?.length ?? 0,
            }))
          : undefined
      }
    />
  );
}
