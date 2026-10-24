import type { FormStepProgressProps } from '@formhaus/react';
import { useContext } from 'react';
import { PageContext } from '../page';

export function StepProgress({
  rootProps,
  current,
  total,
  steps,
  counterLabel,
  stepTitle,
  stepDescription,
  headingLevel = 1,
}: FormStepProgressProps) {
  const { soloSteps } = useContext(PageContext);
  const Heading = `h${headingLevel}` as const;
  const solo = soloSteps.has(steps?.[current - 1]?.id ?? '');
  return (
    <div {...rootProps}>
      <span className="govuk-caption-l">{counterLabel ?? `Step ${current} of ${total}`}</span>
      {stepTitle && !solo && <Heading className="govuk-heading-l">{stepTitle}</Heading>}
      {stepDescription && <p className="govuk-body">{stepDescription}</p>}
    </div>
  );
}
