import type { FormStepProgressProps } from '@formhaus/react';

export function StepProgress({
  rootProps,
  current,
  total,
  counterLabel,
  stepTitle,
  stepDescription,
  headingLevel = 1,
}: FormStepProgressProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <div {...rootProps}>
      <span className="govuk-caption-l">{counterLabel ?? `Step ${current} of ${total}`}</span>
      {stepTitle && <Heading className="govuk-heading-l">{stepTitle}</Heading>}
      {stepDescription && <p className="govuk-body">{stepDescription}</p>}
    </div>
  );
}
