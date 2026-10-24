import type { FormActionsProps } from '@formhaus/react';

export function FormActions({
  rootProps,
  primaryLabel,
  showPrimary = true,
  showBack,
  backLabel,
  showSkip,
  skipLabel,
  cancelAction,
  loading,
  onPrimary,
  onBack,
  onSkip,
  onCancel,
}: FormActionsProps) {
  return (
    <div className="govuk-button-group" {...rootProps}>
      {showPrimary && (
        <button type="button" className="govuk-button" data-module="govuk-button" disabled={loading} onClick={onPrimary}>
          {primaryLabel}
        </button>
      )}
      {showBack && (
        <button
          type="button"
          className="govuk-button govuk-button--secondary"
          data-module="govuk-button"
          disabled={loading}
          onClick={onBack}
        >
          {backLabel}
        </button>
      )}
      {showSkip && onSkip && (
        <button
          type="button"
          className="govuk-button govuk-button--secondary"
          data-module="govuk-button"
          disabled={loading}
          onClick={onSkip}
        >
          {skipLabel}
        </button>
      )}
      {cancelAction && (
        <button type="button" className="govuk-link govuk-body govuk-!-margin-0 app-link-button" onClick={onCancel}>
          {cancelAction.label}
        </button>
      )}
    </div>
  );
}
