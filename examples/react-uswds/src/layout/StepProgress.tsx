import type { FormStepProgressProps } from '@formhaus/react';

export function StepProgress({
  rootProps,
  current,
  total,
  steps,
  marks,
  stepTitle,
  stepDescription,
  headingLevel = 2,
}: FormStepProgressProps) {
  const Heading = `h${headingLevel}` as const;
  const segments = steps ?? Array.from({ length: total }, (_, index) => ({ id: String(index), title: undefined, errorCount: 0 }));

  return (
    <div {...rootProps} className="progress">
      <div className={steps ? 'usa-step-indicator usa-step-indicator--counters-sm' : 'usa-step-indicator usa-step-indicator--no-labels'}>
        <ol className="usa-step-indicator__segments">
          {segments.map((step, index) => {
            const state = index + 1 < current ? 'complete' : index + 1 === current ? 'current' : undefined;
            return (
              <li
                key={step.id}
                className={state ? `usa-step-indicator__segment usa-step-indicator__segment--${state}` : 'usa-step-indicator__segment'}
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <span className="usa-step-indicator__segment-label">
                  {step.title ?? `Step ${index + 1}`}
                  {marks && step.errorCount > 0 && <span className="progress__errors"> ({step.errorCount} to fix)</span>}
                  {state === 'complete' && <span className="usa-sr-only"> completed</span>}
                  {!state && <span className="usa-sr-only"> not completed</span>}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="usa-step-indicator__header">
          <Heading className="usa-step-indicator__heading">
            <span className="usa-step-indicator__heading-counter">
              <span className="usa-sr-only">Step</span>
              <span className="usa-step-indicator__current-step">{current}</span>
              <span className="usa-step-indicator__total-steps"> of {total}</span>
            </span>
            {stepTitle && <span className="usa-step-indicator__heading-text">{stepTitle}</span>}
          </Heading>
        </div>
      </div>
      {stepDescription && <p className="usa-intro progress__description">{stepDescription}</p>}
    </div>
  );
}
