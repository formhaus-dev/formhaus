import type { FormStepProgressProps } from './types';

export function FormStepProgress({
  current,
  total,
  stepTitle,
  stepDescription,
}: FormStepProgressProps) {
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
      {stepTitle && <h3 className="fh-step-progress__title">{stepTitle}</h3>}
      {stepDescription && <p className="fh-step-progress__description">{stepDescription}</p>}
    </div>
  );
}
