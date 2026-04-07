import type { FormActionsProps } from './types';

export function FormActions({
  submitAction,
  backAction,
  cancelAction,
  isFirstStep,
  isLastStep,
  isMultiStep,
  loading,
  onSubmit,
  onNext,
  onPrev,
  onCancel,
  primaryLabel: primaryLabelProp,
  showBack: showBackProp,
  backLabel: backLabelProp,
  onPrimary: onPrimaryProp,
}: FormActionsProps) {
  const showBack = showBackProp ?? (isMultiStep && !isFirstStep && backAction !== false);
  const backLabel = backLabelProp ?? (typeof backAction === 'object' ? (backAction?.label ?? 'Back') : 'Back');
  const primaryLabel = primaryLabelProp ?? (isMultiStep && !isLastStep ? 'Continue' : (submitAction?.label ?? 'Submit'));

  function handlePrimary() {
    if (onPrimaryProp) {
      onPrimaryProp();
    } else if (isMultiStep && !isLastStep) {
      onNext();
    } else {
      onSubmit();
    }
  }

  return (
    <div className="fh-form-actions">
      <div className="fh-form-actions__secondary">
        {showBack && (
          <button
            type="button"
            className="fh-form-actions__btn fh-form-actions__btn--text"
            disabled={loading}
            onClick={onPrev}
          >
            {backLabel}
          </button>
        )}
        {cancelAction && (
          <button
            type="button"
            className="fh-form-actions__btn fh-form-actions__btn--text"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelAction.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className="fh-form-actions__btn fh-form-actions__btn--primary"
        disabled={loading}
        aria-busy={loading}
        onClick={handlePrimary}
      >
        {primaryLabel}
      </button>
    </div>
  );
}
