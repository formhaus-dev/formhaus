import type { FormStepProgressProps } from './types';

export function FormStepProgress({
  current,
  total,
  stepTitle,
  stepDescription,
  headingLevel = 2,
  steps,
}: FormStepProgressProps) {
  const Heading = `h${headingLevel}` as const;
  const percent = (current / total) * 100;

  return (
    <div className="fh-step-progress">
      <div className="fh-step-progress__bar">
        <div className="fh-step-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="fh-step-progress__info">
        <span className="fh-step-progress__counter">
          Step {current} of {total}
        </span>
      </div>
      {steps && (
        <ol className="fh-step-progress__steps">
          {steps.map((step, index) => (
            <li key={step.id} className={`fh-step-progress__step${step.errorCount ? ' fh-step-progress__step--invalid' : ''}`}
              aria-current={index + 1 === current ? 'step' : undefined}>
              {step.title || `Step ${index + 1}`}
              {step.errorCount > 0 && ` · ${step.errorCount} ${step.errorCount === 1 ? 'error' : 'errors'}`}
            </li>
          ))}
        </ol>
      )}
      {stepTitle && <Heading className="fh-step-progress__title">{stepTitle}</Heading>}
      {stepDescription && <p className="fh-step-progress__description">{stepDescription}</p>}
    </div>
  );
}
