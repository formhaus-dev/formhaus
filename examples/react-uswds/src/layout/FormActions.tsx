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
  isMultiStep,
  isLastStep,
  testIds,
  onPrimary,
  onBack,
  onSkip,
  onCancel,
}: FormActionsProps) {
  return (
    <ul className="usa-button-group actions" {...rootProps}>
      {showBack && (
        <li className="usa-button-group__item">
          <button type="button" className="usa-button usa-button--outline" disabled={loading} data-testid={testIds?.back} onClick={onBack}>
            {backLabel}
          </button>
        </li>
      )}
      {showPrimary && (
        <li className="usa-button-group__item">
          <button
            type="submit"
            className="usa-button"
            disabled={loading}
            aria-busy={loading || undefined}
            data-testid={testIds?.[isMultiStep && !isLastStep ? 'next' : 'submit']}
            onClick={(event) => {
              event.preventDefault();
              onPrimary?.();
            }}
          >
            {primaryLabel}
          </button>
        </li>
      )}
      {showSkip && onSkip && (
        <li className="usa-button-group__item">
          <button type="button" className="usa-button usa-button--unstyled" disabled={loading} onClick={onSkip}>
            {skipLabel}
          </button>
        </li>
      )}
      {cancelAction && (
        <li className="usa-button-group__item">
          <button type="button" className="usa-button usa-button--unstyled" disabled={loading} onClick={onCancel}>
            {cancelAction.label}
          </button>
        </li>
      )}
    </ul>
  );
}
