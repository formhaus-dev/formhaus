import type { FormEngine } from '@formhaus/core';
import { labelFor } from '@formhaus/core/internal';
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
  useFormSnapshot(engine);
  if (!engine.isMultiStep || !ProgressComponent) return null;
  const errors = marks ? engine.stepErrors : {};
  const { current, total } = engine.progress;

  return (
    <ProgressComponent
      current={current}
      total={total}
      counterLabel={labelFor('stepOf', { current, total }, labels, engine.definition.labels)}
      stepTitle={engine.currentStep?.title}
      stepDescription={engine.currentStep?.description}
      headingLevel={headingLevel}
      steps={marks ? engine.visibleSteps.map(({ id, title }) => ({ id, title, errorCount: errors[id]?.length ?? 0 })) : undefined}
    />
  );
}
