import type { FormStepProgressProps } from '@formhaus/react';

export function StepProgress({ counterLabel, stepTitle, stepDescription, stepErrorsLabel, headingLevel = 2 }: FormStepProgressProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className="grid gap-1 pb-2">
      <p className="text-sm text-muted-foreground">{counterLabel}</p>
      {stepTitle && <Heading className="text-lg font-medium">{stepTitle}</Heading>}
      {stepErrorsLabel && <p className="text-sm text-destructive">{stepErrorsLabel}</p>}
      {stepDescription && <p className="text-sm text-muted-foreground">{stepDescription}</p>}
    </div>
  );
}
