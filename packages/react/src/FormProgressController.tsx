import type { FormEngine } from '@formhaus/core';
import { labelFor } from '@formhaus/core/internal';
import { useMemo } from 'react';
import { useFormSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormProgressControllerProps {
  engine: FormEngine;
  ProgressComponent: FormRendererProps['progressComponent'];
  headingLevel: FormRendererProps['headingLevel'];
  marks?: boolean;
  labels?: FormRendererProps['labels'];
}

export function FormProgressController({ engine, ProgressComponent, headingLevel, marks, labels }: FormProgressControllerProps) {
  const version = useFormSnapshot(engine);
  const errors = useMemo(() => (ProgressComponent && engine.isMultiStep ? engine.stepErrors : {}), [engine, version, ProgressComponent]);
  if (!engine.isMultiStep || !ProgressComponent) return null;
  const { current, total } = engine.progress;

  return (
    <ProgressComponent
      current={current}
      total={total}
      counterLabel={labelFor('stepOf', { current, total }, labels, engine.definition.labels)}
      stepTitle={engine.currentStep?.title}
      stepDescription={engine.currentStep?.description}
      headingLevel={headingLevel}
      stepErrorCount={errors[engine.currentStep?.id ?? '']?.length ?? 0}
      steps={marks ? engine.visibleSteps.map(({ id, title }) => ({ id, title, errorCount: errors[id]?.length ?? 0 })) : undefined}
    />
  );
}
