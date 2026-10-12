import type { FormStepProgressProps } from '@formhaus/react';

export function StepProgress({ current, total, stepTitle, headingLevel = 2 }: FormStepProgressProps) {
  const Heading = `h${headingLevel}` as const;

  return (
    <div className="grid gap-1 pb-2">
      <p className="text-sm text-muted-foreground">
        Step {current} of {total}
      </p>
      {stepTitle && <Heading className="text-lg font-medium">{stepTitle}</Heading>}
    </div>
  );
}
