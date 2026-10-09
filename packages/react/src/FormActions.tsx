import type { FormAction } from '@formhaus/core';
import { isActionDisabled } from './isActionDisabled';
import type { FormActionsProps } from './types';

function buttonClass(action: FormAction | false | undefined, variant: NonNullable<FormAction['variant']>): string {
  return `fh-form-actions__button fh-form-actions__button--${(action && action.variant) || variant}`;
}

export function FormActions({
  submitAction,
  backAction,
  cancelAction,
  skipAction,
  isFirstStep,
  isLastStep,
  isMultiStep,
  loading,
  showPrimary = true,
  values = {},
  onSubmit,
  onNext,
  onPrev,
  onCancel,
  onSkip,
  primaryLabel: primaryLabelProp,
  showBack: showBackProp,
  backLabel: backLabelProp,
  showSkip: showSkipProp,
  skipLabel: skipLabelProp,
  onPrimary: onPrimaryProp,
}: FormActionsProps) {
  const showBack = showBackProp ?? (isMultiStep && !isFirstStep && backAction !== false);
  const backLabel = backLabelProp ?? (backAction || undefined)?.label ?? 'Back';
  const showSkip = showSkipProp ?? (isMultiStep && !!skipAction);
  const skipLabel = skipLabelProp ?? skipAction?.label ?? 'Skip';
  const primaryLabel = primaryLabelProp ?? (isMultiStep && !isLastStep ? 'Continue' : (submitAction?.label ?? 'Submit'));

  const primaryDisabled = isActionDisabled(
    isMultiStep && !isLastStep ? undefined : submitAction,
    values,
    loading,
  );

  const handlePrimary = onPrimaryProp ?? (isMultiStep && !isLastStep ? onNext : onSubmit);

  return (
    <div className="fh-form-actions">
      <div className="fh-form-actions__secondary">
        {showBack && (
          <button type="button" className={buttonClass(backAction, 'secondary')} disabled={loading} onClick={onPrev}>
            {backLabel}
          </button>
        )}
        {cancelAction && (
          <button type="button" className={buttonClass(cancelAction, 'text')} disabled={loading} onClick={onCancel}>
            {cancelAction.label}
          </button>
        )}
        {showSkip && (
          <button type="button" className={buttonClass(skipAction, 'text')} disabled={loading} onClick={onSkip}>
            {skipLabel}
          </button>
        )}
      </div>
      {showPrimary && <button
        type="button"
        className="fh-form-actions__button fh-form-actions__button--primary"
        disabled={primaryDisabled}
        aria-busy={loading}
        onClick={() => handlePrimary()}
      >
        {primaryLabel}
      </button>}
    </div>
  );
}
