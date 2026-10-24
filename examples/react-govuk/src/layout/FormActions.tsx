import type { FormActionsProps } from '@formhaus/react';
import { Button } from 'govuk-frontend';
import { useContext } from 'react';
import { createPortal } from 'react-dom';
import { useGovuk } from '../govuk';
import { BackLinkTarget } from '../page';
import { LinkButton } from './LinkButton';

export function FormActions({
  rootProps,
  primaryLabel,
  isLastStep,
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
  const target = useContext(BackLinkTarget);
  const button = useGovuk(Button);
  return (
    <div className="govuk-button-group" {...rootProps}>
      {showBack &&
        target &&
        createPortal(
          <button type="button" className="govuk-back-link app-back-link" disabled={loading} onClick={onBack}>
            {backLabel}
          </button>,
          target,
        )}
      <button
        type="submit"
        className="govuk-button"
        data-module="govuk-button"
        ref={button}
        disabled={loading}
        aria-disabled={loading || undefined}
        onClick={(event) => {
          event.preventDefault();
          onPrimary?.();
        }}
      >
        {isLastStep ? 'Continue' : primaryLabel}
      </button>
      {showSkip && onSkip && (
        <button
          type="button"
          className="govuk-button govuk-button--secondary"
          data-module="govuk-button"
          ref={button}
          disabled={loading}
          onClick={onSkip}
        >
          {skipLabel}
        </button>
      )}
      {cancelAction && <LinkButton onClick={onCancel}>{cancelAction.label}</LinkButton>}
    </div>
  );
}
