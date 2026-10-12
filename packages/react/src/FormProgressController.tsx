import type { FormEngine } from '@formhaus/core';
import { useStructureSnapshot } from './hooks/useEngineSnapshot';
import type { FormRendererProps } from './types';

interface FormProgressControllerProps {
  engine: FormEngine;
  ProgressComponent: FormRendererProps['progressComponent'];
  headingLevel: FormRendererProps['headingLevel'];
}

export function FormProgressController({
  engine,
  ProgressComponent,
  headingLevel,
}: FormProgressControllerProps) {
  useStructureSnapshot(engine);
  if (!engine.isMultiStep || !ProgressComponent) return null;

  return (
    <ProgressComponent
      current={engine.progress.current}
      total={engine.progress.total}
      stepTitle={engine.currentStep?.title}
      stepDescription={engine.currentStep?.description}
      headingLevel={headingLevel}
    />
  );
}
