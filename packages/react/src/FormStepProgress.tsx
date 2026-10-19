import { useContext } from 'react';
import { LabelContext } from './labels';
import type { FormStepProgressProps } from './types';

export function FormStepProgress({
  current,
  total,
  stepTitle,
  stepDescription,
  headingLevel = 2,
  steps,
  counterLabel,
}: FormStepProgressProps) {
  const text = useContext(LabelContext);
  const Heading = `h${headingLevel}` as const;
  const percent = (current / total) * 100;

  return (
    <div className="fh-step-progress">
      <div className="fh-step-progress__bar">
        <div className="fh-step-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="fh-step-progress__info">
        <span className="fh-step-progress__counter">{counterLabel ?? text('stepOf', { current, total })}</span>
      </div>
      {steps && (
        <ol className="fh-step-progress__steps">
          {steps.map((step, index) => {
            const label = step.title || text('stepTitle', { index: index + 1 });
            return (
              <li
                key={step.id}
                className={`fh-step-progress__step${step.errorCount ? ' fh-step-progress__step--invalid' : ''}`}
                aria-current={index + 1 === current ? 'step' : undefined}
              >
                {index + 1 === current ? <strong>{label}</strong> : label}
                {step.errorCount > 0 && ` · ${text('stepErrors', { count: step.errorCount })}`}
              </li>
            );
          })}
        </ol>
      )}
      {stepTitle && <Heading className="fh-step-progress__title">{stepTitle}</Heading>}
      {stepDescription && <p className="fh-step-progress__description">{stepDescription}</p>}
    </div>
  );
}
