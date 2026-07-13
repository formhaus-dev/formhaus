import type { FormEngine } from '@formhaus/core';
import { FormStepProgress } from './FormStepProgress';
import { useStructureSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormProgressControllerProps {
  engine: FormEngine;
  ProgressComponent: FormRendererProps['ProgressComponent'];
}

export function FormProgressController({
  engine,
  ProgressComponent,
}: FormProgressControllerProps) {
  useStructureSnapshot(engine);
  if (!engine.isMultiStep) return null;

  const Progress = ProgressComponent ?? FormStepProgress;
  return (
    <Progress
      current={engine.progress.current}
      total={engine.progress.total}
      stepTitle={engine.currentStep?.title}
      stepDescription={engine.currentStep?.description}
    />
  );
}
