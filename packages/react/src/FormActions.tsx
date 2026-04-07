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
}: FormActionsProps) {
  const showBack = isMultiStep && !isFirstStep && backAction !== false;
  const backLabel = typeof backAction === 'object' ? backAction?.label : 'Back';

  function handlePrimary() {
    if (isMultiStep && !isLastStep) {
      onNext();
    } else {
      onSubmit();
    }
  }

  const primaryLabel = isMultiStep && !isLastStep ? 'Continue' : (submitAction?.label ?? 'Submit');

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
