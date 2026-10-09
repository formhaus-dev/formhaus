import type { FormStepProgressProps } from '@formhaus/react';

export function StepProgress({ current, total, stepTitle }: FormStepProgressProps) {
  return (
    <div className="grid gap-1 pb-2">
      <p className="text-sm text-muted-foreground">
        Step {current} of {total}
      </p>
      {stepTitle && <h2 className="text-lg font-medium">{stepTitle}</h2>}
    </div>
  );
}
