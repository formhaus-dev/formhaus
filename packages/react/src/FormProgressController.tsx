import type { FormEngine } from '@formhaus/core';
import { useFormSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormProgressControllerProps {
  engine: FormEngine;
  ProgressComponent: FormRendererProps['progressComponent'];
  headingLevel: FormRendererProps['headingLevel'];
  marks?: boolean;
}

export function FormProgressController({
  engine,
  ProgressComponent,
  headingLevel,
  marks,
}: FormProgressControllerProps) {
  useFormSnapshot(engine);
  if (!engine.isMultiStep || !ProgressComponent) return null;
  const errors = marks ? engine.stepErrors : {};

  return (
    <ProgressComponent
      current={engine.progress.current}
      total={engine.progress.total}
      stepTitle={engine.currentStep?.title}
      stepDescription={engine.currentStep?.description}
      headingLevel={headingLevel}
      steps={marks ? engine.visibleSteps.map(({ id, title }) => ({ id, title, errorCount: errors[id]?.length ?? 0 })) : undefined}
    />
  );
}
