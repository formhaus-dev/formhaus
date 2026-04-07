import { evaluateCondition } from '@formhaus/core';
import type { FormAction } from '@formhaus/core';
import type { FormActionsProps } from './types';

function isActionDisabled(
  action: FormAction | undefined,
  values: Record<string, unknown>,
  loading?: boolean,
): boolean {
  if (loading) return true;
  if (!action?.disabled || action.disabled.length === 0) return false;
  return action.disabled.every((c) => evaluateCondition(c, values));
}

export function FormActions({
  submitAction,
  backAction,
  cancelAction,
  isFirstStep,
  isLastStep,
  isMultiStep,
  loading,
  values = {},
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

  const primaryDisabled = isActionDisabled(
    isMultiStep && !isLastStep ? undefined : submitAction,
    values,
    loading,
  );

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
            className="fh-form-actions__button fh-form-actions__button--text"
            disabled={loading}
            onClick={onPrev}
          >
            {backLabel}
          </button>
        )}
        {cancelAction && (
          <button
            type="button"
            className="fh-form-actions__button fh-form-actions__button--text"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelAction.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className="fh-form-actions__button fh-form-actions__button--primary"
        disabled={primaryDisabled}
        aria-busy={loading}
        onClick={handlePrimary}
      >
        {primaryLabel}
      </button>
    </div>
  );
}
